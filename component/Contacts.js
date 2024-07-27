import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, makeStyles,
    Button, TextField, Typography, Paper, Grid, Accordion, AccordionSummary, AccordionDetails, withStyles } from "@material-ui/core";
import ContactItem from "./ContactItem";
import Alert from '@material-ui/lab/Alert';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import IconButton from "@material-ui/core/IconButton";
import { useState, useEffect, useRef } from "react";
import { onValue, set, ref, push, child, remove, get, onChildAdded } from "firebase/database";
import { db, app } from "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigation } from "react-router-dom";


const useStyles = makeStyles((theme) => ({
    container: {
        border: "1px solid rgb(200, 200, 200)",
        height: "calc(100vh - 74px)",
        maxHeight: "calc(100vh - 74px)",
    },
    text: {
        textAlign: "center", 
        height:"70px",
        fontFamily: "H",
    },
    icon: {
        color:"black", 
        float: "right"
    },
    groupItemContainer: {
        border: "1px solid rgb(200, 200, 200)",
        overflowY: 'auto',
        width: '99%',
        margin: "0 auto"
    },
    accordion: {
        margin: 0,
        padding: 0,
    },
    '@global': {
        '*::-webkit-scrollbar': {
          width: '0.6em',
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: 'white'
        },
        '*::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,.1)',
            outline: '1px solid slategrey',
            borderRadius: '5px',
            '&:hover': {
                backgroundColor: 'rgba(0,0,0,.4)'
            },
        }
      }
  }));

const accordionStyles = {
    root: {
        border: "1px solid rgb(200, 200, 200)",
        overflow: 'auto',
      '&$expanded': {
        margin: '1px',
      },
    },
    expanded: {},
};
const CustomAccordion = withStyles(accordionStyles)(Accordion);

function getNowTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const formattedTime = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const hourTime = hours.toString().padStart(2, '0') + ":" + minutes.toString().padStart(2, '0');
    return [formattedTime, hourTime];
}

async function createNewGroup(groupName, empty, setEmpty, setErrorMessage, setOpen, username, uid) {
    if(groupName === '') {
        setEmpty(true);
        setErrorMessage("Group name cannot be empty!");
    } else {
        const formattedTime = getNowTime()[0];
        const chatRef = ref(db, 'chats/');
        const firstMessage = {
            'first': [formattedTime, 1, username + " created the group"]
        };
        const groupKey = push(chatRef, firstMessage).key;
        await push(ref(db, 'chats/' + groupKey), [formattedTime, 1, username + " created the group"]).then(() => {
            remove(ref(db, 'chats/' + groupKey + "/first"));
        });
        const dataRef = ref(db, 'group/' + groupKey);
        const createMessage = {
            groupName: groupName,
            id: groupKey,
            time: formattedTime,
            lastContent: username + " created the group",
            read: [uid],
            notif: [uid]
        };
        await set(dataRef, createMessage).catch(() => {
            setEmpty(true);
            setErrorMessage("Failed to create group!");
        });
        if(empty) return;
        
        const memberRef = ref(db, 'members/' + groupKey + '/' + uid);
        const joinRef = ref(db, "join/" + uid + '/' + groupKey);
        await set(memberRef, [uid, username]).catch(() => {
            setEmpty(true);
            setErrorMessage("Failed to create group!");
            remove(memberRef);
            remove(newDataRef);
        });
        if(empty) return;

        await set(joinRef, [groupName, groupKey]).catch(e => {
            setEmpty(true);
            setErrorMessage("Failed to create group!");
            remove(memberRef);
            remove(newDataRef);
            remove(joinRef);
        })
        if(empty) return;

        setOpen(false);
    }
}

const Contacts = ({contactInfo, groupsList, username, setGroupsList, setContactInfo, friendsList, setFriendsList}) => {
    const classes = useStyles();
    const [open, setOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [empty, setEmpty] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [uid, setUid] = useState("");

    useEffect(() => {
        onAuthStateChanged(getAuth(app), async (user) => {
            if (user) {
                setUid(user.uid);
                const joinRef = ref(db, 'join/' + user.uid);
                var sortedNames = [];
                onValue(joinRef, async (snapshot) => {
                    if(snapshot.exists()) {
                        var info = snapshot.val();
                        var timestamp = [];
                        var joinedGroup = [];
                        console.log(info)
                        for (const key in info) {
                            const value = info[key];
                            const res = await get(child(ref(db), 'group/' + key)).then((snapshot) => {
                                return snapshot.val()
                            })
                            timestamp.push(res['time']);
                            joinedGroup.push([value[0], value[1], !res['read'].includes(user.uid)]);
                        }
                        const sortedIndices = timestamp.map((_, index) => index)
                        .sort((a, b) => new Date(timestamp[b]).getTime() - new Date(timestamp[a]).getTime());
                        sortedNames = sortedIndices.map(index => joinedGroup[index]);
                        setGroupsList(sortedNames);
                        setContactInfo([sortedNames[0][0], sortedNames[0][1], 0]);
                    }
                });

                const friendRef = ref(db, 'user/' + user.uid + '/friends');
                onValue(friendRef, async (snapshot) => {
                    if (snapshot.exists()) {
                        var info = [], timestamp = [];
                        for (const [key, value] of Object.entries(snapshot.val())) {
                            let friendId = value['id'], friendName = value['name'];
                            const res = await get(child(ref(db), 'personalChats/' + key)).then((snapshot) => {
                                return snapshot.val();
                            });
                            console.log(res['read']);
                            timestamp.push(res['lastTime']);
                            info.push([friendName, key, !res['read'].includes(user.uid), friendId]);
                        }
                        const sortedIndices = timestamp.map((_, index) => index).
                        sort((a, b) => new Date(timestamp[b]).getTime() - new Date(timestamp[a]).getTime());
                        sortedNames = sortedIndices.map(index => info[index]);
                        setFriendsList(sortedNames)
                    }
                });
            }
        });
    }, []);
    
    return (
        <div className={classes.container}>
        <Typography variant="h3" className={classes.text}>
                    Contact
                    <IconButton className={classes.icon} onClick={() => {setOpen(true)}}>
                        <AddCircleOutlineIcon 
                            style={{fontSize:"35px"}}>
                        </AddCircleOutlineIcon>
                    </IconButton>
        </Typography>
        <Paper elevation={5} style={{'height':'calc(100% - 70px)', 'maxHeight':'calc(100% - 70px)', 'overflow':'auto'}}>
            <CustomAccordion>
                <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                >
                    <Typography variant="h4">Friends</Typography>
                </AccordionSummary>
                <AccordionDetails className={classes.accordion}>
                    <Grid direction="column" spacing={0} className={classes.groupItemContainer}>
                            {friendsList.map(([friendName, chatId, isNew, friendId], index) => {
                                return (<ContactItem 
                                            key={index} 
                                            index={index} 
                                            name={friendName} 
                                            id={chatId} 
                                            setContactInfo={setContactInfo}
                                            isNew={isNew}
                                            type={1}
                                            friendId={friendId}
                                        ></ContactItem>);
                            })}
                    </Grid>
                </AccordionDetails>
            </CustomAccordion>
            <CustomAccordion>
                <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                >
                <Typography variant="h4">Groups</Typography>
                </AccordionSummary>
                <AccordionDetails className={classes.accordion}>
                    <Grid direction="column" spacing={0} className={classes.groupItemContainer}>
                        {groupsList.map(([groupName, groupId, isNew], index) => {
                            return (<ContactItem 
                                        key={index} 
                                        index={index} 
                                        name={groupName} 
                                        id={groupId} 
                                        setContactInfo={setContactInfo}
                                        isNew={isNew}
                                        type={0}
                                    ></ContactItem>);
                        })}
                    </Grid>
                </AccordionDetails>
            </CustomAccordion>
        </Paper>
        <Dialog open={open} onClose={() => {setOpen(false);}} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Create group</DialogTitle>
            <DialogContent>
            <DialogContentText>
                To create a group, please enter group name here.
            </DialogContentText>
            <TextField
                autoFocus
                margin="dense"
                fullWidth
                label="Group Name"
                style={{color: "black"}}
                value={groupName}
                onChange={(e) => {
                    if(e.target.value.length <= 15)
                        setGroupName(e.target.value);
                }}
            />
            <div style={{float:'right'}}>{groupName.length} / 15</div>
            {empty ? <Alert severity="error" onClose={() => {setEmpty(false)}}>{errorMessage}</Alert> : <></>}
            </DialogContent>
            <DialogActions>
            <Button onClick={() => {setOpen(false);}} style={{color: "black"}}>
                Cancel
            </Button>
            <Button onClick={() => {
                                        createNewGroup(groupName, empty, setEmpty, setErrorMessage, setOpen, username, uid);
                                        setGroupName("");
                                    }} style={{color: "black"}}
            >
                Create
            </Button>
            </DialogActions>
        </Dialog>
        </div>
    );
}

export default Contacts;