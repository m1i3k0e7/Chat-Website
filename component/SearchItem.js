import { Typography, makeStyles, Paper } from "@material-ui/core";
import { onValue, set, ref, push, child, remove, get } from "firebase/database";
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

function processJoin(groupId, isJoined, uid, username, groupName, setIsJoined) {
    if(!isJoined) {
        get(child(ref(db), 'chats/' + groupId)).then(async (snapshot) => {
            const data = snapshot.val();
            const chatRef = ref(db, 'chats/' + groupId);
            set(chatRef, [
                ...data,
                [getNowTime()[0], 1, username + ' joined the group']
            ])
        });
        get(child(ref(db), 'group/' + groupId)).then(async (snapshot) => {
            const data = snapshot.val();
            const groupRef = ref(db, 'group/' + groupId);
            set(groupRef, {
                groupName: data['groupName'],
                id: data['id'],
                lastContent: username + ' joined the group',
                time: getNowTime()[1],
                read: [uid],
                notif: [uid]
            })
        });
        get(child(ref(db), 'join/' + uid)).then(async (snapshot) => {
            const data = snapshot.val();
            const joinRef = ref(db, "join/" + uid);
            if(data) {
                const newData = [...data, [groupName, groupId]];
                set(joinRef, newData);
            } else {
                set(joinRef, [[groupName, groupId]]);
            }
        });
        get(child(ref(db), 'members/' + groupId)).then(async (snapshot) => {
            const data = snapshot.val();
            const memberRef = ref(db, "members/" + groupId);
            set(memberRef, [...data, uid + "_" + username]);
        }).then(resolve => { setIsJoined(true); });
    }
}
const SearchItem = ({groupName, groupId, username}) => {
    const classes = useStyles();
    const [isJoined, setIsJoined] = useState(false);
    const [uid, setUid] = useState('');
    useEffect(() => {
        onAuthStateChanged(getAuth(app), (user) => {
            if(user) {
                setUid(user.uid);
                get(child(ref(db), 'members/' + groupId)).then(async (snapshot) => {
                    const data = snapshot.val();
                    if(data && data.includes(user.uid + '_' + username)) {
                        setIsJoined(true);
                    }
                })
            }
        });
    }, []);

    return (
        <Paper elevation={0} className={classes.container}>
            <Typography variant="h4" className={classes.text}> {groupName} </Typography>
            <IconButton 
                        className={classes.icon} 
                        onClick={() => {
                            processJoin(groupId, isJoined, uid, username, groupName, setIsJoined)
                        }}
            >
                {isJoined ? <CheckIcon></CheckIcon> : <AddIcon></AddIcon>}
            </IconButton>
        </Paper>
    );
}

export default SearchItem;