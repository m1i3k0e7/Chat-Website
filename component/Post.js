import { useState, useEffect, useRef } from "react";
import { onValue, set, ref, child, get, onChildAdded, push, update } from "firebase/database";
import { db, app } from "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { grey } from '@material-ui/core/colors';
import { makeStyles, Paper, Button, IconButton, Dialog, DialogTitle, DialogActions,
         DialogContent, TextField, withStyles, Grid } from "@material-ui/core";
import AddCircleIcon from '@material-ui/icons/AddCircle';
import PostItem from "./PostItem";

const useStyles = makeStyles((theme) => ({
    paper: {
        transform: 'translate(-50%, -50%)',
        position: 'fixed',
        top: '59%',
        left: '50%',
        width: '40vw',
        height: '75vh',
        boxShadow: 
        'inset -4px -4px 4px rgba(220,220,220, 0.7), inset  4px  4px 4px rgba(220,220,220, 0.8)',
        backgroundColor: 'rgb(245, 245, 245)',
    },
    plusButton: {
        position: 'absolute',
        fontSize: '60px',
        right: '5px',
        bottom: '5px',
        color: 'black'
    },
    textArea: {
        width: '100%',
    },
    postItemContainer: {
        border: "1px solid rgb(200, 200, 200)",
        height: '100%',
        overflowY: 'auto',
    },
}));

const ColorButton = withStyles((theme) => ({
    root: {
        color: theme.palette.getContrastText(grey[900]),
        backgroundColor: grey[900],
        '&:hover': {
            backgroundColor: grey[700],
        },
        float: 'right',
        margin: '10px',
        width: '45px'
    },
}))(Button);

function submitPost(uid, username, date, postContent, setPostContent, handleClose) {
    try {
        const postData = [uid, username, date, postContent];
        const postRef = ref(db, 'posts/');
        push(postRef, postData).then(() => {
            setPostContent("");
            handleClose()
        })
    } catch(error) {
        console.log(error.message)
    }
}

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
    return formattedTime;
}

const Post = ({uid, username}) => {
    const classes = useStyles();
    const [open, setOpen] = useState(false);
    const [postList, setPostList] = useState([]);
    const [postContent, setPostContent] = useState('');
    const addedIds = useRef(new Map());

    useEffect(() => {
        const postRef = ref(db, 'posts/');
        onChildAdded(postRef, (snapshot) => {
            if (snapshot.exists()) {
                const post = snapshot.val();
                const postId = snapshot.key;
                if (!addedIds.current.has(postId)) {
                    addedIds.current.set(postId, true);
                    setPostList((prev) => [...prev, post]);
                }
                console.log(post);
            }
        });
        // onValue(postRef, (snapshot) => {
        //     if (snapshot.exists()) {
        //         const posts = snapshot.val();
        //         const valuesArray = Object.values(posts)
        //         setPostList(valuesArray);
        //     }
        // });
    }, []);

    const handleClickOpen = () => {
        setOpen(true);
      };
    
    const handleClose = () => {
        setOpen(false);
    };

    return (
        <div>
            <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title" fullWidth={100}>
                <DialogTitle id="form-dialog-title">New Post</DialogTitle>
                <DialogContent >
                <TextField
                    aria-label="minimum height"
                    multiline
                    minRows={20}
                    className={classes.textArea}
                    label="Post Something..."
                    variant="outlined"
                    value={postContent}
                    onChange={(e) => {
                        setPostContent(e.target.value);
                    }}
                />
                </DialogContent>
                <DialogActions>
                <ColorButton onClick={handleClose}>
                    Cancel
                </ColorButton>
                <ColorButton onClick={() => {
                    if (postContent != '') {
                        submitPost(uid, username, getNowTime(), postContent, setPostContent, handleClose);
                    }
                }}>
                    Submit
                </ColorButton>
                </DialogActions>
            </Dialog>
        
            <Paper variant="outlined" className={classes.paper} >
                <Grid  direction="column" spacing={0} className={classes.postItemContainer}>
                    {postList.map(([authorID, authorName, postDate, postContent], index) => {
                        return (<PostItem uid={uid} authorID={authorID} authorName={authorName} postDate={postDate} postContent={postContent}></PostItem>)
                    })}
                </Grid>
                <IconButton 
                            className={classes.plusButton}
                            onClick={handleClickOpen}
                >
                    <AddCircleIcon style={{fontSize: '60px'}}/>
                </IconButton>
            </Paper>
        
        </div>
    );
}

export default Post;