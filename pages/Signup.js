import { withStyles, makeStyles, Box, Toolbar, AppBar, Button, Divider, TextField, Typography } from "@material-ui/core";
import Alert from '@material-ui/lab/Alert';
import { grey } from '@material-ui/core/colors';
import { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import Header from "../component/Header"
import "../style.css";
import {  createUserWithEmailAndPassword, getAuth, signOut  } from 'firebase/auth';
import { set, ref } from "firebase/database";
import { db, app } from "../firebase";

const useStyles = makeStyles((theme) => ({
    title: {
      flexGrow: 1,
      [theme.breakpoints.down('md')]: {
        fontSize: '22px',
        },
      [theme.breakpoints.down('sm')]: {
        fontSize: '16px',
        },
    },
  }));

const ColorButton = withStyles((theme) => ({
    root: {
        color: theme.palette.getContrastText(grey[900]),
        backgroundColor: grey[900],
        '&:hover': {
            backgroundColor: grey[700],
        },
    },
}))(Button);

async function firebaseSignup(username, email, password, checkPassword, setAlert, setAlertMessage, navigate) {
    const regexExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi;
    if(username === '' || email === '' || password.length < 6) {
        setAlert(true);
        setAlertMessage("Failed to sign up! Please retry.")
        return;
    } else if(password !== checkPassword) {
        setAlert(true);
        setAlertMessage("Recheck password is different from password!");
        return;
    } else if(!regexExp.test(email)) {
        setAlert(true);
        setAlertMessage("Please input a valid email!");
        return;
    }

    await createUserWithEmailAndPassword(getAuth(app), email, password)
        .then(async (userCredential) => {
            await set(ref(db, 'user/' + userCredential.user.uid + '/'), {
                username: username,
                email: email, 
                uid: userCredential.user.uid,
            })
        })
        .then(() => {
            signOut(getAuth(app)).then(() => {
                console.log("Signed out successfully")
            })
            navigate('/', {state: { isSignup: true}});
        })
        .catch((error) => {
            console.log(error.code, error.message);
            setAlert(true);
            setAlertMessage("Failed to sign up! Please retry.");
        });
}

const SignupPage = () => {
    const navigate = useNavigate();
    const classes = useStyles();
    const navItems = ['Sign In', 'Sign Up'];
    const [alert, setAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [checkPassword, setCheckpassword] = useState("");
    const navis = [() => {navigate('/')}, () => {navigate('/signup')}]

    return (
        <div>
            <Header navItems={navItems} classes={classes} title={"Chat Room"} selected={"Sign Up"} navis={navis} login={false}></Header>
            <div className="login" style={{top: "40%"}}>
                <Typography variant="h6" style={{marginLeft:"10px"}}>
                        {"Username"}
                </Typography>
                <Divider variant="middle" />
                <div className="inputField">
                    <TextField 
                        label="Username"
                        variant="outlined"
                        size="small"
                        fullWidth
                        onChange={e => {
                            setUsername(e.target.value);
                        }}
                    />
                </div>
                <Typography variant="h6" style={{marginLeft:"10px"}}>
                        {"Email"}
                </Typography>
                <Divider variant="middle" />
                <div className="inputField">
                    <TextField 
                        label="Email"
                        variant="outlined"
                        size="small"
                        type="email"
                        fullWidth
                        onChange={e => {
                            setEmail(e.target.value);
                        }}
                    />
                </div>
                <Typography variant="h6" style={{marginLeft:"10px"}}>
                    {"Password"}
                </Typography>
                <Divider variant="middle" />
                <div className="inputField">
                    <TextField 
                        label="Password"
                        variant="outlined"
                        size="small"
                        type="password"
                        fullWidth
                        onChange={e => {
                            setPassword(e.target.value);
                        }}
                    />
                </div>
                <Typography variant="h6" style={{marginLeft:"10px"}}>
                    {"Recheck Password"}
                </Typography>
                <Divider variant="middle" />
                <div className="inputField">
                    <TextField 
                        label="Recheck Password"
                        variant="outlined"
                        size="small"
                        type="password"
                        fullWidth
                        onChange={e => {
                            setCheckpassword(e.target.value);
                        }}
                    />
                </div>
                <div className="inputField">
                    <ColorButton 
                        variant="contained"
                        fullWidth
                        color="primary"
                        onClick={() => {firebaseSignup(username, email, password, checkPassword, setAlert, setAlertMessage, navigate)}}
                    >
                        Sign Up
                    </ColorButton>
                </div>
                {alert ? 
                <div className="inputField">
                    <Alert severity="error" onClose={() => {setAlert(false)}}>{alertMessage}</Alert>
                </div>
                : <div></div>}
            </div>
        </div>
    );
};

export default SignupPage;