import { Typography, makeStyles, Paper } from "@material-ui/core";
import { onValue, set, ref, push, child, remove, get, update } from "firebase/database";
import { useState, useEffect, useRef } from "react";
import { db, app } from "../firebase";
import AddIcon from '@material-ui/icons/Add';
import CheckIcon from '@material-ui/icons/Check';
import IconButton from "@material-ui/core/IconButton";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

const useStyles = makeStyles((theme) => ({
    container: {
        display: 'flex',
        justifyContent: 'space-between',
        '&:hover': {
            backgroundColor: 'rgb(240, 240, 240)'
        },
        borderRadius: 0,
    },
    icon: {
        float: 'right'
    }, 
    text: {
        [theme.breakpoints.down('md')]: {
            fontSize: '22px',
        },
        [theme.breakpoints.down('sm')]: {
            fontSize: '15px',
        },
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

async function processJoin(groupId, isJoined, uid, username, groupName, setIsJoined) {
    if(!isJoined) {
        const chatRef = ref(db, 'chats/' + groupId);
        const groupRef = ref(db, 'group/' + groupId);        
        const joinRef = ref(db, 'join/' + uid + '/' + groupId);
        const memberRef = ref(db, 'members/' + groupId + '/' + uid);
        const joinMessage = [getNowTime()[0], 1, username + ' joined the group']
        const updates = {
            lastContent: username + ' joined the group',
            time: getNowTime()[0],
            read: [uid],
            notif: [uid],
        }

        await push(chatRef, joinMessage)
        .then(() => {
            update(groupRef, updates);
        })
        .then(() => {
            set(joinRef, [groupName, groupId]);
        })
        .then(() => {
            push(memberRef, [uid, username])
        })
        .then(() => {
            setIsJoined(true)
        })
        .catch((e) => {
            console.log(e);
        })
    }
}

async function ProcessAdd(isAdded, id, uid, name, username, setIsAdded) {
    if (!isAdded) {
        const nowTime = getNowTime()[0];
        const text = username + " added " + name + " as a new friend.";
        const newPersonalChat = {
            user1: name,
            user1Id: id,
            user2: username,
            user2Id: uid,
            lastText: text,
            lastTime: nowTime,
            read: [uid],
        }
        const firstMessage = {'first': [nowTime, 1, text]};

        const newChatKey = await push(ref(db, 'chats/'), firstMessage).key
        console.log(newChatKey);
        push(ref(db, 'chats/' + newChatKey), [nowTime, 1, text]).then(() => {
            remove(ref(db, 'chats/' + newChatKey + '/first'));
        }).then(() => {
            return set(ref(db, 'personalChats/' + newChatKey), newPersonalChat);
        }).then(() => {
            return set(ref(db, 'user/' + uid + '/friends/' + newChatKey), {
                name: name,
                id: id,
            });
        }).then(() => {
            return set(ref(db, 'user/' + id + '/friends/' + newChatKey), {
                name: username,
                id: uid,
            });
        }).then(() => {
            setIsAdded(true);
        }).catch((error) => {
            console.error("Error in operations: ", error);
        });
    }
}

const SearchItem = ({type, name, id, username, joined}) => {
    const classes = useStyles();
    const [isAdded, setIsAdded] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const [uid, setUid] = useState('');
    useEffect(() => {
        onAuthStateChanged(getAuth(app), (user) => {
            if(user) {
                setUid(user.uid);
            }
            switch (type) {
                case 0:
                    setIsAdded(joined);
                    break;
                case 1:
                    setIsJoined(joined);
                    break;
                default:
                    console.log("wrong search type.")
            }
        });
    }, []);

    return (
        <Paper elevation={0} className={classes.container}>
            <Typography variant="h4" className={classes.text}> {name} </Typography>
            <IconButton 
                        className={classes.icon} 
                        onClick={() => {
                            switch (type) {
                                case 0:
                                    ProcessAdd(isAdded, id, uid, name, username, setIsAdded);
                                    break;
                                case 1:
                                    processJoin(id, isJoined, uid, username, name, setIsJoined);
                                    break;
                                default:
                                    console.log("wrong search type, add failed.");
                            }
                        }}
            >
                {((isJoined && type == 1) || (isAdded && type == 0)) ? <CheckIcon></CheckIcon> : <AddIcon></AddIcon>}
            </IconButton>
        </Paper>
    );
}

export default SearchItem;