import { useState, useEffect, useRef } from "react";
import { ref, child, get } from "firebase/database";
import { db } from "../firebase";
import { Chip, makeStyles, Typography } from "@material-ui/core";
import { useNavigate } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
    root: {
        padding: '5px',
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    notification: {
        backgroundColor: 'rgb(70, 70, 70)',
        color: 'white',
        borderRadius: '50px 50px 50px 50px',
        paddingLeft: '5px',
        paddingRight: '5px',
        minWidth: '160px',
        textAlign: 'center',
        paddingTop: '2px',
        paddingBottom: '2px'
    }, 
    selfMessage: {
        paddingRight: '5px',
        paddingBottom: '10px',
        display: 'flex',
        justifyContent: "flex-end",
    },
    otherMessage: {
        paddingLeft: '5px',
        paddingBottom: '10px',
        display: 'flex',
        justifyContent: "flex-start"
    },
    selfBubble: {
        backgroundColor: '#46A3FF',
        color: 'white',
        borderRadius: '20px 0px 20px 20px',
        display: 'flex',
        alignItems: 'center',
        maxWidth: 350,
        minHeight: 20,
        wordWrap: 'break-word',
        wordBreak: 'break-all',
        padding: '7px',
        paddingRight: '10px',
        paddingLeft: '10px'
    },
    otherBubble: {
        backgroundColor: '#E0E0E0',
        color: 'black',
        borderRadius: '0px 20px 20px 20px',
        display: 'flex',
        alignItems: 'center',
        maxWidth: 350,
        minHeight: 20,
        wordWrap: 'break-word',
        wordBreak: 'break-all',
        padding: '7px',
        paddingRight: '10px',
        paddingLeft: '10px'
    },
    time: {
        padding: '5px',
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
    }, 
    selfName: {
        backgroundColor: "white",
        paddingRight: '5px',
        display: 'flex',
        justifyContent: "flex-end"
    },
    otherName: {
        backgroundColor: "white",
        paddingLeft: '5px',
        display: 'flex',
        justifyContent: "flex-start"
    },
    username: {
        '&:hover': {
            cursor: 'pointer'
        },
    }
}));

const ChatItem = ({time, type, self, content, showName, showTime}) => {
    const classes = useStyles();
    const [name, setName] = useState("");
    const nameRef = useRef();
    const navigate = useNavigate();
    useEffect(() => {
        get(child(ref(db), 'user/' + type)).then((data) => {
            setName(data.val()['username']);
        }).catch(error => {
            setName('');
        })
    }, [type]);
    return (
        <div>
            { showTime ? <div className={classes.time}>{time.substring(0, 16)}</div> : <div></div>}
            {(showName || showTime) && type !== 1 ? <div className={ self ? classes.selfName : classes.otherName}>
                                <Typography 
                                            variant="button" 
                                            display="block"
                                            className={classes.username}
                                            onClick={() => {
                                                localStorage.setItem("uidContext", type);
                                                navigate('/profile');
                                            }}            
                                >
                                    {name}
                                </Typography>
                            </div> 
                            : 
                            <div></div>}
            <div className={ type === 1 ? classes.root : (self ? classes.selfMessage : classes.otherMessage) }>
                
                <div className={self ? classes.selfBubble : (type === 1 ? classes.notification : classes.otherBubble)}>{content}</div>
            </div>
        </div>
    );
};

export default ChatItem;