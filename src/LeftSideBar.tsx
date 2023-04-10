import {
    Box,
    Divider,
    Grid,
    IconButton, List,
    ListItemIcon,
    ListSubheader,
    MenuItem,
    MenuList,
    Stack,
    Toolbar,
    Typography
} from "@mui/material";
import {isMobile} from "react-device-detect";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import React, {useRef} from "react";
import {useTranslation} from "react-i18next";
import icon from "./icon.png";
import * as api from "./api";
import SessionItem from "./SessionItem";
import {createMessage, createSession, Message, Session, Settings} from "./types";
import useStore from './store'

interface Props {
    leftSideBarVisible:boolean
    setLeftSideBarVisible(leftSideBarVisible:boolean):void
    openSettingWindow:boolean
    setOpenSettingWindow(openSettingWindow:boolean):void
    configureChatConfig:Session | null
    setConfigureChatConfig(configureChatConfig:Session | null):void
}

export default function LeftSideBar(props: Props) {
    const {t} = useTranslation()
    const {leftSideBarVisible,setLeftSideBarVisible}=props;
    const {openSettingWindow, setOpenSettingWindow} = props;
    const {configureChatConfig, setConfigureChatConfig}= props;
    const store = useStore()
    const messageListRef = useRef<HTMLDivElement>(null)

    if (!leftSideBarVisible) {
        return null
    }
    return (
        <>
            <Grid item xs={"auto"}
                  sx={{
                      height: '100%'
                  }}
            >
                <Stack
                    sx={{
                        height: '100%',
                        padding: '0px 0',
                    }}
                    spacing={0}
                >
                    <Toolbar variant="dense" sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: 'space-between'
                    }}>
                        <img src={icon} style={{
                            width: '18px',
                            height: '18px',
                            marginRight: '0px',
                        }} title="Chatbox"/>

                    </Toolbar>
                    {
                        (isMobile) ? (<></>) : (
                            <Divider/>
                        )
                    }
                    <MenuList
                        sx={{
                            width: '100%',
                            // bgcolor: 'background.paper',
                            position: 'relative',
                            overflow: 'auto',
                            // height: '30vh',
                            height: '60vh',
                            '& ul': {padding: 0},
                        }}
                        className="scroll"
                        subheader={
                            <ListSubheader component="div">
                                {/*{t('chat')}*/}
                            </ListSubheader>
                        }
                    >
                        {
                            store.chatSessions.map((session, ix) => (
                                <SessionItem key={session.id}
                                             selected={store.currentSession.id === session.id}
                                             session={session}
                                             switchMe={() => {
                                                 store.switchCurrentSession(session)
                                                 document.getElementById('message-input')?.focus() // better way?
                                             }}
                                             deleteMe={() => store.deleteChatSession(session)}
                                             copyMe={() => {
                                                 const newSession = createSession(session.model, session.name + ' copied')
                                                 newSession.messages = session.messages
                                                 store.createChatSession(newSession, ix)
                                             }}
                                             editMe={() => setConfigureChatConfig(session)}
                                />
                            ))
                        }
                    </MenuList>

                    <Divider/>
                    <MenuItem>
                        <IconButton onClick={() => setLeftSideBarVisible(false)}
                                    edge="end" color="inherit"
                                    aria-label="menu" sx={{mr: 2}}>
                            <ArrowBackIosNewIcon onClick={() => setLeftSideBarVisible(false)}/>
                        </IconButton>
                    </MenuItem>
                    <MenuItem onClick={() => store.createEmptyChatSession()}>
                        <ListItemIcon>
                            <IconButton><AddIcon fontSize="small"/></IconButton>
                        </ListItemIcon>
                        {
                            // (isMobile)?(<></>):(
                            // <ListItemText>
                            //     {t('new chat')}
                            // </ListItemText>
                            // )
                        }
                        <Typography variant="body2" color="text.secondary">
                            {/* ⌘N */}
                        </Typography>
                    </MenuItem>
                    <MenuItem onClick={() => {
                        setOpenSettingWindow(true)
                    }}
                    >
                        <ListItemIcon>
                            <IconButton><SettingsIcon fontSize="small"/></IconButton>
                        </ListItemIcon>
                        {
                            //     (isMobile)?(<></>):(
                            // <ListItemText>
                            //     {t('settings')}
                            // </ListItemText>
                            //     )
                        }
                        <Typography variant="body2" color="text.secondary">
                            {/* ⌘N */}
                        </Typography>
                    </MenuItem>

                    <MenuItem onClick={() => {
                        // setNeedCheckUpdate(false)
                        api.openLink('https://github.com/nufeng1999/chatbox')
                    }}>
                        <ListItemIcon>
                            <IconButton>
                                <InfoOutlinedIcon fontSize="small"/>
                            </IconButton>
                        </ListItemIcon>
                        {/*<ListItemText>*/}
                        {/*    <Badge color="primary" variant="dot" invisible={!needCheckUpdate} sx={{ paddingRight: '8px' }} >*/}
                        {/*        <Typography sx={{ opacity: 0.5 }}>*/}
                        {/*            {t('version')}: {store.version}*/}
                        {/*        </Typography>*/}
                        {/*    </Badge>*/}
                        {/*</ListItemText>*/}
                    </MenuItem>
                </Stack>

            </Grid>
       </>
    );
}
