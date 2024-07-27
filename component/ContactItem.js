import { Typography, makeStyles, Paper } from "@material-ui/core";
import { onValue, ref, child, get, onChildAdded, set, update } from "firebase/database";
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

function getInfo(id, setTime, setContent, type) {
    if (type == 0) {
        get(child(ref(db), 'group/' + id)).then((snapshot) => {
            const data = snapshot.val();
            setTime(data['time']);
            setContent(data['lastContent']);
        });
    } else if (type == 1) {
        get(child(ref(db), 'personalChats/' + id)).then((snapshot) => {
            const data = snapshot.val();
            setTime(data['lastTime']);
            setContent(data['lastText']);
        });
    }
}

const ContactItem = ({name, id, setContactInfo, isNew, type, friendId, index}) => {
    const classes = useStyles();
    const [time, setTime] = useState("");
    const [content, setContent] = useState("");
    const [uid, setUid] = useState('');

    useEffect(() => {
        getInfo(id, setTime, setContent, type);
    });

    useEffect(() => {
        onAuthStateChanged(getAuth(app), async (user) => {
            if (user) {
                setUid(user.uid);
            }
        });
    }, [])
    
    useEffect(() => {
        getInfo(id, setTime, setContent, type);
        if (type == 0) {
            const groupRef = ref(db, 'group/' + id);
            onValue(groupRef, (snapshot) => {
                if(snapshot.exists()) {
                    getInfo(id, setTime, setContent, type);
                }
            });
        } else if (type == 1) {
            const friendRef = ref(db, 'personalChats/' + id);
            onValue(friendRef, (snapshot) => {
                if (snapshot.exists()) {
                    getInfo(id, setTime, setContent, type);
                }
            })
        }
    }, [id])
    
    return (
        <Paper 
            className={classes.container} 
            elevation={5} 
            onClick={() => {
                if (type != 0 && type != 1) {
                    return;
                }
                setContactInfo([name, id, type]);
                const refPath = (type == 0 ? 'group/' : 'personalChats/') + id;
                get(child(ref(db), refPath)).then((snapshot) => {
                    const data = snapshot.val();
                    if(data) {
                        var newRead = data['read'];
                        onAuthStateChanged(getAuth(app), async (user) => {
                            if (user && !newRead.includes(user.uid)) {
                                newRead.push(user.uid);
                                const readRef = ref(db, refPath);
                                const updates = {'read': newRead};
                                update(readRef, updates);
                                // set(groupRef, {
                                //     ...data,
                                //     read: newRead
                                // });
                            }
                        });
                    }
                });
            }}>
            <div className={classes.name}>
                <Typography variant="h4" className={classes.text}> {name} </Typography>
                <Typography variant="h6" className={isNew ? classes.newMessage : classes.oldMessage}> {content.length > 15 ? content.substring(0, 15) + '...' : content} </Typography>
            </div>
            <Typography variant="h6" className={classes.time}> {time.substring(11, 16)} </Typography>
        </Paper>
    );
}

export default ContactItem;