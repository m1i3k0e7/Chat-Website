import { Typography, makeStyles, Paper } from "@material-ui/core";
import { useState, useEffect, useRef } from "react";
import { ref, get, child } from "firebase/database";
import { db, app } from "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const useStyles = makeStyles((theme) => ({
    container: {
        backgroundColor: 'rgb(255, 255, 255)',
        '&:hover': {
            backgroundColor: 'rgb(240, 240, 240)'
        },
    },
    textTitle: {
        display: 'flex'
    },
    name: {
        [theme.breakpoints.down('md')]: {
            fontSize: '24px',
        },
        [theme.breakpoints.down('sm')]: {
            fontSize: '17px',
        },
    },
    time: {
        paddingLeft: '10px',
        paddingTop: '8px',
        [theme.breakpoints.down('md')]: {
            fontSize: '15px',
        },
        [theme.breakpoints.down('sm')]: {
            fontSize: '15px',
        },
    },
    text: {
        display: 'block',
        wordWrap: 'break-word',
        wordBreak: 'break-all',
        [theme.breakpoints.down('md')]: {
            fontSize: '22px',
        },
        [theme.breakpoints.down('sm')]: {
            fontSize: '15px',
        },
    }
  }));

const SearchChatItem = ({time, type, content}) => {
    const classes = useStyles();
    const [username, setUsername] = useState('');

    useEffect(() => {
        onAuthStateChanged(getAuth(app), (user) => {
            if (user) {
                get(child(ref(db), 'user/' + type)).then(async (snapshot) => {
                    const data = snapshot.val()['username'];
                    if(data) {
                        setUsername(data);
                    }
                })
            }
        });
    }, [type]);

    return (
        <Paper elevation={0} className={classes.container}>
            <div className={classes.textTitle}>
                <Typography variant="h6" className={classes.name}>{username}</Typography>
                <Typography variant="body2" className={classes.time}>{time}</Typography>
            </div>
            <Typography variant="subtitle1" className={classes.text}>{content}</Typography>
        </Paper>
    );
}

export default SearchChatItem;