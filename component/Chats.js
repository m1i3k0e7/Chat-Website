import { useState, useEffect, useRef } from "react";
import { onValue, set, ref, child, get, onChildAdded } from "firebase/database";
import { db, app } from "../firebase";
import ChatItem from "./ChatItem";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { makeStyles, TextField, Typography, Paper, Grid } from "@material-ui/core";
import IconButton from "@material-ui/core/IconButton";
import SearchIcon from '@material-ui/icons/Search';
import SendIcon from '@material-ui/icons/Send';
import SearchChat from "./SearchChat";

const useStyles = makeStyles((theme) => ({
    container: {
        border: "1px solid rgb(200, 200, 200)",
        height: `calc(100vh - 74px)`,
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
        height: `calc(100vh - 199px)`,
        overflowY: 'auto',
    },
    inputField: {
        minHeight: '55px',
    }, 
    textField: {
        width: 'calc(100% - 60px)',
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

function sendMessage(message, groupName, groupId, uid) {
    try {
        const groupRef = ref(db, 'group/' + groupId);
        set(groupRef, {
            groupName: groupName,
            id: groupId,
            lastContent: message,
            time: getNowTime()[0],
            read: [uid],
            notif: [uid],
        }).then((data) => {
            get(child(ref(db), 'chats/' + groupId)).then(async (snapshot) => {
                const data = snapshot.val();
                return data;
            }).then((data) => {
                const chatRef = ref(db, 'chats/' + groupId);
                set(chatRef, [
                    ...data,
                    [getNowTime()[0], uid, message]
                ])
            })
        });
    } catch(error) {
        console.log(error.message);
    }
}

function calTimeDiff(time1, time2) {
    const date1 = new Date(time1);
    const date2 = new Date(time2);
    const diffInMs = Math.abs(date2 - date1);
    const diffInSec = Math.floor(diffInMs / 1000);

    return diffInSec >= 180;
}

const Chat = ({groupInfo, setGroupsList, groupsList}) => {
    const classes = useStyles();
    const [message, setMessage] = useState("");
    const [uid, setUid] = useState("");
    const [chatList, setChatList] = useState([]);
    const [isSearch, setIsSearch] = useState(false);
    const groupRef = useRef(); 
    const scrollRef = useRef(null);

    useEffect(() => {
        groupRef.current = groupInfo;
        onAuthStateChanged(getAuth(app), (user) => {
            if (user) {
                setUid(user.uid);
            }
        });
    }, []);

    useEffect(() => {
        if(!groupInfo || groupInfo.length == 0) return;
        groupRef.current = groupInfo;
        get(child(ref(db), 'chats/' + groupRef.current[1])).then((data) => {
            setChatList(data.val());
        })
        const chatRef = ref(db, 'chats/' + groupRef.current[1]);
        onValue(chatRef, (snapshot) => {
            if(snapshot.exists()) {
                const data = snapshot.val();
                setChatList(data);
            }
            window.nonFirst = false;
        });
    }, [groupInfo])

    useEffect(() => {
        onAuthStateChanged(getAuth(app), async (user) => {
            if (user) {
                setUid(user.uid);
                const joinRef = ref(db, 'join/' + user.uid);
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
                        const sortedNames = sortedIndices.map(index => info[index]);
                        setGroupsList(sortedNames);
                    }
                });
            }
        });
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [chatList]);
    
    return (
        <div className={classes.container}>
            <Typography variant="h3" className={classes.text}>
                {groupInfo ? groupInfo[0] : ""}
                <IconButton className={classes.icon} onClick={() => { setIsSearch(!isSearch); }}>
                        <SearchIcon 
                            style={{fontSize:"38px"}}>
                        </SearchIcon>
                </IconButton>
            </Typography>
            {isSearch ? <SearchChat chatList={chatList}></SearchChat> : <div></div>}
            <Paper elevation={5}>
                <Grid direction="column" spacing={0} className={classes.groupItemContainer} ref={scrollRef}>
                    {chatList.map(([time, type, content], index) => {
                        return (<ChatItem key={index} 
                                          time={time} 
                                          type={type} 
                                          self={type===uid} 
                                          content={content} 
                                          showName={(index !== 0 && (chatList[index][1] !== chatList[index - 1][1] && chatList[index][1] !== 1))}
                                          showTime={(index === 0 || calTimeDiff(chatList[index][0], chatList[index - 1][0]))}>
                                </ChatItem>)
                    })}
                </Grid>
                <div className={classes.inputField}>
                    <TextField 
                        id="standard-basic" 
                        label="Message" 
                        variant="outlined"
                        multiline
                        value={message}
                        className={classes.textField}
                        style={{backgroundColor: 'rgb(255, 255, 255)'}}
                        onChange={ (e) => {
                            if(e.target.value.length <= 120)
                                setMessage(e.target.value); 
                        } }
                    />
                    <IconButton className={classes.icon} onClick={() => {
                        if(message !== '') {
                            sendMessage(message, groupInfo[0], groupInfo[1], uid);
                            setMessage("");
                        }
                    }}>
                        <SendIcon 
                            style={{fontSize:"33px"}}>
                        </SendIcon>
                    </IconButton>
                </div>
            </Paper>
        </div>
    );
}

export default Chat;