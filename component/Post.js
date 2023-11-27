import { useState, useEffect, useRef } from "react";
import { onValue, set, ref, child, get, onChildAdded } from "firebase/database";
import { db, app } from "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { makeStyles, TextField, Paper, Button, IconButton, Dialog, DialogTitle, DialogActions, DialogContent, DialogContentText } from "@material-ui/core";
import AddCircleIcon from '@material-ui/icons/AddCircle';

const useStyles = makeStyles((theme) => ({
    container: {
        position: 'fixed',
        top: '60%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
    },
    paper: {
        width: '40vw',
        height: '40vw',
        boxShadow: 
        'inset -4px -4px 4px rgba(220,220,220, 0.7), inset  4px  4px 4px rgba(220,220,220, 0.8)'
    },
    plusButton: {
        position: 'absolute',
        fontSize: '60px',
        right: '5px',
        bottom: '5px',
        color: 'black'
    }
}));

const Post = ({}) => {
    const classes = useStyles();
    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
      };
    
    const handleClose = () => {
        setOpen(false);
    };

    return (
        <div className={classes.container}>
            <Paper variant="outlined" className={classes.paper} >
                <IconButton 
                            className={classes.plusButton}
                            onClick={handleClickOpen}
                >
                    <AddCircleIcon style={{fontSize: '60px'}}/>
                </IconButton>
                <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
                    <DialogTitle id="form-dialog-title">New Post</DialogTitle>
                    <DialogContent>
                    <TextField
                        margin="dense"
                        label="New Post..."
                        fullWidth
                    />
                    </DialogContent>
                    <DialogActions>
                    <Button onClick={handleClose} color="black">
                        Cancel
                    </Button>
                    <Button onClick={handleClose} color="black">
                        Submit
                    </Button>
                    </DialogActions>
                </Dialog>
            </Paper>
            
        </div>
    );
}

export default Post;