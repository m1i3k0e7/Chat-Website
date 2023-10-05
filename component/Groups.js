import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, makeStyles, Button, TextField, Typography, Paper, Grid } from "@material-ui/core";
import GroupItem from "./GroupItem";
import Alert from '@material-ui/lab/Alert';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import IconButton from "@material-ui/core/IconButton";
import { useState, useEffect, useRef } from "react";
import { onValue, set, ref, push, child, remove, get, onChildAdded } from "firebase/database";
import { db, app } from "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigation } from "react-router-dom";


const useStyles = makeStyles((theme) => ({
    container: {
        border: "1px solid rgb(200, 200, 200)",
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
        maxHeight: `calc(100vh - 144px)`,
        overflowY: 'auto',
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

function createNewGroup(groupName, empty, setEmpty, setErrorMessage, setOpen, username, uid) {
    if(groupName === '') {
        setEmpty(true);
        setErrorMessage("Group name cannot be empty!");
    } else {
        const [formattedTime, hourTime] = getNowTime();

        const dataRef = ref(db, 'group/');
        const newDataRef = push(dataRef);
        set(newDataRef, {
            groupName: groupName,
            id: newDataRef.key,
            time: formattedTime,
            lastContent: username + " created the group",
            read: [uid],
            notif: [uid]
        }).catch(() => {
            setEmpty(true);
            setErrorMessage("Failed to create group!");
        });
        if(empty) return;
        
        const memberRef = ref(db, 'members/' + newDataRef.key);
        const chatRef = ref(db, "chats/" + newDataRef.key);
        const joinRef = ref(db, "join/" + uid);
        set(memberRef, [uid + "_" + username]).then((data) => {
            set(chatRef, [[formattedTime, 1, username + " created the group"]]);
        }).catch(() => {
            setEmpty(true);
            setErrorMessage("Failed to create group!");
            remove(memberRef);
            remove(newDataRef);
        });
        get(child(ref(db), 'join/' + uid)).then((data) => {
            if(data.val()) {
                const newData = [...data.val(), [groupName, newDataRef.key]];
                set(joinRef, newData);
            } else {
                set(joinRef, [[groupName, newDataRef.key]]);
            }
        }).catch((data) => {
            setEmpty(true);
            setErrorMessage("Failed to create group!");
            remove(memberRef);
            remove(newDataRef);
            remove(joinRef);
        });
        if(empty) return;

        setOpen(false);
    }
}

const Groups = ({groupInfo, groupsList, username, setGroupsList, setGroupInfo}) => {
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
                        for(let i = 0; i < info.length; i++) {
                            let id = info[i][1];
                            const res = await get(child(ref(db), 'group/' + id)).then((snapshot) => {
                                return snapshot.val();
                            });
                            timestamp.push(res['time']);
                            info[i].push(!res['read'].includes(user.uid));
                        }
                        const sortedIndices = timestamp.map((_, index) => index)
                        .sort((a, b) => new Date(timestamp[b]).getTime() - new Date(timestamp[a]).getTime());
                        sortedNames = sortedIndices.map(index => info[index]);
                        setGroupsList(sortedNames);
                    }
                    
                });
            }
        });
    }, []);
    
    return (
        <div className={classes.container}>
        <Typography variant="h3" className={classes.text}>
                    {"Groups"}
                    <IconButton className={classes.icon} onClick={() => {setOpen(true)}}>
                        <AddCircleOutlineIcon 
                            style={{fontSize:"35px"}}>
                        </AddCircleOutlineIcon>
                    </IconButton>
        </Typography>
        <Paper elevation={5}>
            <Grid direction="column" spacing={0} className={classes.groupItemContainer}>
                {groupsList.map(([groupName, groupId, isNew], index) => {
                    return (<GroupItem 
                                key={index} 
                                index={index} 
                                groupName={groupName} 
                                groupId={groupId} 
                                setGroupInfo={setGroupInfo}
                                isNew={isNew}
                            ></GroupItem>);
                })}
            </Grid>
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

export default Groups;