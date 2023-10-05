import { Typography, makeStyles, Paper } from "@material-ui/core";
import { onValue, ref, child, get, onChildAdded, set } from "firebase/database";
import { useState, useEffect, useRef } from "react";
import { db, app } from "../firebase";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
    container: {
        borderRadius: "5px",
        border: "2px solid rgb(240, 240, 240)",
        height: "100px",
        '&:hover': {
            backgroundColor: 'rgb(240, 240, 240)'
        },
    }, 
    name: {
        float: "left",
        padding: "10px",
        wordWrap: 'break-word',
        whiteSpace: 'normal',
    },
    time: {
        float: "right",
        padding: "10px",
        [theme.breakpoints.down('md')]: {
            fontSize: '12px',
            padding: '5px'
        },
        [theme.breakpoints.down('sm')]: {
            fontSize: '7px',
            padding: '2px'
        },
        
    }, 
    newMessage: {
        color: "black"
    },
    oldMessage: {
        color: "rgb(140,140,140)",
        [theme.breakpoints.down('sm')]: {
            fontSize: '15px',
            wordWrap: 'break-word',
            whiteSpace: 'normal',
        },
    },
    text: {
        [theme.breakpoints.down('sm')]: {
            fontSize: '15px',
        },
    }
  }));

function getInfo(groupId, setTime, setContent) {
    get(child(ref(db), 'group/' + groupId)).then((snapshot) => {
        const data = snapshot.val();
        setTime(data['time']);
        setContent(data['lastContent']);
    })
}

function notifyUser(message = 'New Message from Chat Room') {
    
}

const GroupItem = ({groupName, groupId, setGroupInfo, isNew, index}) => {
    const classes = useStyles();
    const [time, setTime] = useState("");
    const [content, setContent] = useState("");
    const [uid, setUid] = useState('');
    var isLoaded = false;

    useEffect(() => {
        getInfo(groupId, setTime, setContent);
    });

    useEffect(() => {
        console.log('reload');
        onAuthStateChanged(getAuth(app), async (user) => {
            if (user) {
                setUid(user.uid);
            }
        });
        const chatRef = ref(db, 'chats/' + groupId);
        get(chatRef).then((snapshot) => {
            isLoaded = true;
        });
    }, [])
    
    useEffect(() => {
        getInfo(groupId, setTime, setContent);
        const groupRef = ref(db, 'group/' + groupId);
        onValue(groupRef, (snapshot) => {
            if(snapshot.exists()) {
                getInfo(groupId, setTime, setContent);
            }
        });
        
        const chatRef = ref(db, 'chats/' + groupId);
        onChildAdded(chatRef, (snapshot) => {
            if(isLoaded) {
                onAuthStateChanged(getAuth(app), (user) => {
                    if (user) {
                        get(child(ref(db), 'group/' + groupId)).then((snapshot) => {
                            const data = snapshot.val();
                            var notifList = snapshot.val()['notif'];
                            const groupRef = ref(db, 'group/' + groupId);
                            if(!notifList.includes(user.uid)) {
                                notifyUser();
                                notifList.push(user.uid);
                                set(groupRef, {
                                    ...data,
                                    notif: notifList
                                })
                            }
                        })
                    }
                });
            }
        });
        
    }, [groupId])
    
    return (
        <Paper 
            className={classes.container} 
            elevation={5} 
            onClick={() => {
                setGroupInfo([groupName, groupId]);
                get(child(ref(db), 'group/' + groupId)).then((snapshot) => {
                    const data = snapshot.val();
                    if(data) {
                        var newRead = data['read'];
                        onAuthStateChanged(getAuth(app), async (user) => {
                            if (user && !newRead.includes(user.uid)) {
                                newRead.push(user.uid);
                                const groupRef = ref(db, 'group/' + groupId);
                                set(groupRef, {
                                    ...data,
                                    read: newRead
                                });
                                
                            }
                        });
                    }
                });
            }}>
            <div className={classes.name}>
                <Typography variant="h4" className={classes.text}> {groupName} </Typography>
                <Typography variant="h6" className={isNew ? classes.newMessage : classes.oldMessage}> {content.length > 15 ? content.substr(0, 15) + '...' : content} </Typography>
            </div>
            <Typography variant="h6" className={classes.time}> {time.substring(11, 16)} </Typography>
        </Paper>
    );
}

export default GroupItem;