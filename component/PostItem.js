import { Typography, makeStyles, Card, CardHeader, CardContent, CardActions, Avatar, IconButton } from "@material-ui/core";
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from "react";
import FavoriteIcon from '@material-ui/icons/Favorite';
import ShareIcon from '@material-ui/icons/Share';
import MoreVertIcon from '@material-ui/icons/MoreVert';

const useStyles = makeStyles((theme) => ({
    root: {
        position: 'relative',
        maxWidth:'99%',
        left: '50%',
        transform: 'translate(-50%, 0%)',
        margin: '4px 0',
    },
    avatar: {
        backgroundColor: 'rgb(0, 0, 0)',
    },
    content: {
        wordBreak: "break-word",
    }
}));

const PostItem = ({uid, authorID, authorName, postDate, postContent}) => {
    const classes = useStyles();
    const navigate = useNavigate();
    useEffect(() => {
        
    });
    
    return (
        <Card className={classes.root} >
            <CardHeader
                avatar={
                    <IconButton onClick={() => {
                        localStorage.setItem("uidContext", authorID);
                        navigate('/profile');
                    }}>
                        <Avatar className={classes.avatar}>
                            {authorName[0]}
                        </Avatar>
                    </IconButton>
                }
                action={
                    uid == authorID ?
                    <IconButton>
                        <MoreVertIcon />
                    </IconButton> : <div></div>
                }
                title={<Typography 
                            variant="button" 
                            onClick={() => {
                                localStorage.setItem("uidContext", authorID);
                                navigate('/profile');
                            }}            
                        >
                            {authorName}
                        </Typography>}
                subheader={postDate}
            />
            <CardContent>
                <Typography variant="body1" className={classes.content}>
                {postContent}
                </Typography>
            </CardContent>
            <CardActions disableSpacing>
                <IconButton>
                <FavoriteIcon />
                </IconButton>
                <IconButton>
                <ShareIcon />
                </IconButton>
            </CardActions>
        </Card>
    );
}

export default PostItem;