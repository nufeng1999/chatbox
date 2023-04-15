import React, {DOMElement, useMemo, useRef} from 'react';
import Block, {Props} from './Block'
import * as client from './client'
import SessionItem from './SessionItem'
import PauseCircleOutlineOutlinedIcon from '@mui/icons-material/PauseCircleOutlineOutlined';
import PlayCircleFilledWhiteOutlinedIcon from '@mui/icons-material/PlayCircleFilledWhiteOutlined';

import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';

import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import MicNoneOutlinedIcon from '@mui/icons-material/MicNoneOutlined';
import MicOffOutlinedIcon from '@mui/icons-material/MicOffOutlined';

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import {BottomNavigation, BottomNavigationAction, SvgIconTypeMap} from '@mui/material';
import {
    Toolbar, Box, Badge, Snackbar,
    List, ListSubheader, ListItemText, MenuList,
    IconButton, Button, Stack, Grid, MenuItem, ListItemIcon, Typography, Divider,
    TextField, AppBar
} from '@mui/material';
import {isMobile} from "react-device-detect";
import {Session, createSession, Message, createMessage, Settings, OpenAIRoleEnum} from './types'
import useStore from './store'
import SettingWindow from './SettingWindow'
import ChatConfigWindow from './ChatConfigWindow'
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import * as prompts from './prompts';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import CleanWidnow from './CleanWindow';
import * as api from './api';
import {ThemeSwitcherProvider} from './theme/ThemeSwitcher';
import {useTranslation} from "react-i18next";
import icon from './icon.png'
import WaitingGif from './Waiting.gif'
import {AutoSpeechControlUnit, pushToAutoSpeedBuffer, } from "./Say";
import LeftSideBar from './leftside/LeftSideBar';
import MicOffIcon from './mic_off.png';
import MicOnIcon from './mic_on.png';
import iconLib from "./iconLib";
import SpeechRecognition, {useSpeechRecognition} from 'react-speech-recognition';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import Face4TwoToneIcon from '@mui/icons-material/Face4TwoTone';
import Face5TwoToneIcon from '@mui/icons-material/Face5TwoTone';
import {display} from "@mui/system";
import {OverridableComponent} from "@mui/types";

const {useEffect, useState} = React

function Main() {
    const {t} = useTranslation()
    const store = useStore()
    const [leftSideBarVisible, setLeftSideBarVisible] = React.useState(true);
    const [isScrolling, setIsScrolling] = React.useState(false)
    const [isPlaying, setIsPlaying] = React.useState(false)
    // 是否展示设置窗口
    const [openSettingWindow, setOpenSettingWindow] = React.useState(false);
    let isReady = false;

    const assistantIconMap = {SmartToyIcon, Face4TwoToneIcon, Face5TwoToneIcon}
    const getAssistantIcon = (iconName: string) => {
        // let DynamicComponent=null;
        // if(msg.role=='assistant') {
        //     if(props.assistantIcon==null)
        //         props.assistantIcon='SmartToyIcon'
        //     const componentType = props.assistantIcon;
        //     DynamicComponent = React.createElement(componentType);
        // }
        const assistantIconMapElement = assistantIconMap[iconName as keyof typeof assistantIconMap];
        return assistantIconMapElement;
    }
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
    if (isMobile) {
        //toggleFullScreen()
    }

    const speechControl = () => {
        setIsPlaying(!isPlaying);

    }

    useEffect(() => {
        if (store.needSetting) {
            setOpenSettingWindow(true)
        }
    }, [store.needSetting])

    // 是否展示应用更新提示
    const [needCheckUpdate, setNeedCheckUpdate] = useState(true)

    const messageListRef = useRef<HTMLDivElement>(null)
    const messageScrollRef = useRef<{ msgId: string, smooth?: boolean } | null>(null)
    useEffect(() => {
        if (!messageScrollRef.current) {
            return
        }
        if (!messageListRef.current) {
            return
        }
        const container = messageListRef.current
        const element = document.getElementById(messageScrollRef.current.msgId)
        if (!container || !element) {
            return
        }
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const isInsideLeft = elementRect.left >= containerRect.left;
        const isInsideRight = elementRect.right <= containerRect.right;
        const isInsideTop = elementRect.top >= containerRect.top;
        const isInsideBottom = elementRect.bottom <= containerRect.bottom;
        if (isInsideLeft && isInsideRight && isInsideTop && isInsideBottom) {
            return
        }
        // 平滑滚动
        element.scrollIntoView({
            behavior: messageScrollRef.current.smooth ? 'smooth' : 'auto',
            block: 'end',
            inline: 'nearest',
        })
    })
    // stop auto-scroll when user scroll
    useEffect(() => {
        if (!messageListRef.current) {
            return
        }
        messageListRef.current.addEventListener('wheel', function (e: any) {
            messageScrollRef.current = null
        });
    }, [])

    // 切换到当前会话，自动滚动到最后一条消息
    useEffect(() => {
        if (store.currentSession.messages.length === 0) {
            return
        }
        const last = store.currentSession.messages[store.currentSession.messages.length - 1]
        messageScrollRef.current = {msgId: last.id, smooth: false}
    }, [store.currentSession])

    // 会话名称自动生成
    useEffect(() => {
        if (
            store.currentSession.name === 'Untitled'
            && store.currentSession.messages.findIndex(msg => msg.role === 'assistant') !== -1
        ) {
            generateName(store.currentSession)
        }
    }, [store.currentSession.messages])

    const codeBlockCopyEvent = useRef((e: Event) => {
        const target: HTMLElement = e.target as HTMLElement;

        const isCopyActionClassName = target.className === 'copy-action';
        const isCodeBlockParent = target.parentElement?.className === 'code-block-wrapper';

        // check is copy action button
        if (!(isCopyActionClassName && isCodeBlockParent)) {
            return;
        }

        // got codes
        const content = target?.parentNode?.querySelector('code')?.innerText ?? '';

        // do copy
        // * thats lines copy from copy block content action
        navigator.clipboard.writeText(content);
        store.addToast(t('copied to clipboard'));
    });

    // bind code block copy event on mounted
    useEffect(() => {
        document.addEventListener('click', codeBlockCopyEvent.current);

        return () => {
            document.removeEventListener('click', codeBlockCopyEvent.current);
        };
    }, []);

    const [configureChatConfig, setConfigureChatConfig] = React.useState<Session | null>(null);

    const [sessionClean, setSessionClean] = React.useState<Session | null>(null);
    const [rightContentWidth, setRightContentWidth] = React.useState("fit-content");
    const editCurrentSession = () => {
        setConfigureChatConfig(store?.currentSession)
    };
    const generateName = async (session: Session) => {
        client.replay(
            store.settings.openaiKey,
            store.settings.apiHost,
            store.settings.maxContextSize,
            store.settings.maxTokens,
            session.model,
            prompts.nameConversation(session.messages.slice(0, 3)),
            ({text: name, frPos}): number => {
                name = name.replace(/['"“”]/g, '')
                session.name = name
                store.updateChatSession(session)
                return frPos;
            },
            (err) => {
                console.log(err)
            }
        )
    }

    const generate = async (session: Session, promptMsgs: Message[], targetMsg: Message) => {
        messageScrollRef.current = {msgId: targetMsg.id, smooth: false}
        await client.replay(
            store.settings.openaiKey,
            store.settings.apiHost,
            store.settings.maxContextSize,
            store.settings.maxTokens,
            session.model,
            promptMsgs,
            ({text, frPos, cancel}): number => {
                for (let i = 0; i < session.messages.length; i++) {
                    if (session.messages[i].id === targetMsg.id) {
                        session.messages[i] = {
                            ...session.messages[i],
                            format: "makrdown",
                            content: text,
                            cancel,
                        }

                        const regex = /(？|！|：|。|\([a-zA-Z]\)\(?=[;\?.!:]\))/g
                        regex.lastIndex = frPos
                        let match = regex.exec(text);
                        if (match != null && match.index > frPos) {
                            let substr = text.substring(frPos, match.index + 1)
                            pushToAutoSpeedBuffer(substr)
                            frPos = match.index + 1
                        }
                        break;
                    }
                }
                store.updateChatSession(session)
                return frPos;
            },
            (err) => {
                for (let i = 0; i < session.messages.length; i++) {
                    if (session.messages[i].id === targetMsg.id) {
                        session.messages[i] = {
                            ...session.messages[i],
                            content: t('api request failed:') + ' \n```\n' + err.message + '\n```',
                        }
                        break
                    }
                }
                store.updateChatSession(session)
            }
        )
        messageScrollRef.current = null
    }

    const [messageInput, setMessageInput] = useState('')
    useEffect(() => {
        document.getElementById('message-input')?.focus() // better way?
    }, [messageInput])

    const sessionListRef = useRef<HTMLDivElement>(null)
    const handleCreateNewSession = () => {
        store.createEmptyChatSession()
        if (sessionListRef.current) {
            sessionListRef.current.scrollTo(0, 0)
        }
    }

    const scrollControl = () => {
        setIsScrolling(!isScrolling);

    }
    return (
        <Box sx={{height: '100vh'}}>
            <LeftSideBar setRightContentWidth={setRightContentWidth}
                         store={store}
                         leftSideBarVisible={leftSideBarVisible}
                         setLeftSideBarVisible={setLeftSideBarVisible}
                         openSettingWindow={openSettingWindow}
                         setOpenSettingWindow={setOpenSettingWindow}
                         configureChatConfig={configureChatConfig}
                         setConfigureChatConfig={setConfigureChatConfig}
            />
            <AppBar position="static">
                <Box>
                    <Toolbar variant="dense">
                        {leftSideBarVisible ? (
                            <IconButton onClick={() => {
                                setLeftSideBarVisible(false);
                                // setRightContentWidth("fit-content")
                            }}
                                        edge="end" color="inherit"
                                        aria-label="menu" sx={{mr: 2}}>
                                <ArrowBackIosNewIcon/>
                            </IconButton>
                        ) : (
                            <IconButton onClick={() => {
                                setLeftSideBarVisible(true);
                                setRightContentWidth("min-content")
                            }}
                                        edge="start" color="inherit"
                                        aria-label="menu" sx={{mr: 1}}>
                                <ArrowForwardIosIcon/>
                            </IconButton>
                        )}
                        <IconButton edge="start" color="inherit" aria-label="menu" sx={{mr: 1}}>
                            <ChatBubbleOutlineOutlinedIcon/>
                        </IconButton>
                        <Typography variant="body2" color="inherit" component="div" noWrap sx={{flexGrow: 1}}>
                                    <span onClick={() => {
                                        editCurrentSession()
                                    }} style={{cursor: 'pointer'}}>
                                        {store.currentSession.name}
                                    </span>
                        </Typography>
                        <IconButton edge="start" color="inherit" aria-label="menu" sx={{mr: 1}}
                                    onClick={() => setSessionClean(store.currentSession)}
                        >
                            <CleaningServicesIcon/>
                        </IconButton>
                    </Toolbar>
                    <Divider/>
                </Box>
            </AppBar>
            <Grid item xs={12} sx={{
                flexWrap: 'nowrap',
                height: 'auto',
                width: rightContentWidth
            }}
                  style={{
                      position: 'absolute',
                      width: '100%',
                      height: 'auto',
                      top: '50px',
                      bottom: '125px'
                  }}>
                {/*右边内容*/}

                <Stack sx={{
                    overflow: 'scroll',
                    position: 'absolute',
                    height: '100%',
                    width: '100%',
                    padding: '0px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflowX: 'hidden'
                }} style={{overflow: 'hidden'}}
                >
                    <List
                        className='scroll'
                        sx={{
                            width: '100%',
                            bgcolor: 'background.paper',
                            overflow: 'auto',
                            '& ul': {padding: 0},
                            flexGrow: 2,
                        }}
                        component="div"
                        ref={messageListRef}
                        style={{overflowX: 'hidden'}}
                    >
                        {
                            store.currentSession.messages.map((msg, ix, {length}) => {
                                    return (
                                        <Block id={msg.id} key={msg.id} msg={msg}
                                               isReady={isReady}
                                               getAssistantIcon={getAssistantIcon}
                                               showWordCount={store.settings.showWordCount || false}
                                               showTokenCount={store.settings.showTokenCount || false}
                                               showModelName={store.settings.showModelName || false}
                                               assistantIcon={store.settings.assistantIcon || 'SmartToyIcon'}
                                               speech={store.settings.speech || ''}
                                               autoSpeech={store.settings.autoSpeech || false}
                                               modelName={store.currentSession.model}
                                               setMsg={(updated) => {
                                                   store.currentSession.messages = store.currentSession.messages.map((m) => {
                                                       if (m.id === updated.id) {
                                                           return updated
                                                       }
                                                       return m
                                                   })
                                                   store.updateChatSession(store.currentSession)
                                               }}
                                               delMsg={() => {
                                                   store.currentSession.messages = store.currentSession.messages.filter((m) => m.id !== msg.id)
                                                   store.updateChatSession(store.currentSession)
                                               }}
                                               refreshMsg={() => {
                                                   if (msg.role === 'assistant') {
                                                       const promptMsgs = store.currentSession.messages.slice(0, ix)
                                                       generate(store.currentSession, promptMsgs, msg)
                                                   } else {
                                                       const promptsMsgs = store.currentSession.messages.slice(0, ix + 1)

                                                       const newAssistantMsg = createMessage(
                                                           OpenAIRoleEnum.Assistant,
                                                           `<div style='width:100%;float:left;display:block'>&#x2003;${iconLib.waiting}</div>`,
                                                           'html');
                                                       const newMessages = [...store.currentSession.messages]
                                                       newMessages.splice(ix + 1, 0, newAssistantMsg)
                                                       store.currentSession.messages = newMessages
                                                       store.updateChatSession(store.currentSession)
                                                       generate(store.currentSession, promptsMsgs, newAssistantMsg)
                                                       messageScrollRef.current = {
                                                           msgId: newAssistantMsg.id,
                                                           smooth: true
                                                       }
                                                   }
                                               }}
                                               copyMsg={() => {
                                                   navigator.clipboard.writeText(msg.content)
                                                   store.addToast(t('copied to clipboard'))
                                               }}
                                               quoteMsg={() => {
                                                   let input = msg.content.split('\n').map((line: any) => `> ${line}`).join('\n')
                                                   input += '\n\n-------------------\n\n'
                                                   setMessageInput(input)
                                               }}
                                        />
                                    )
                                }
                            )
                        }
                    </List>
                </Stack>

                {/*右边内容结束*/}
            </Grid>
            <Grid style={{
                position: 'absolute',
                width: '100%',
                bottom: '0px',
                height: '120px'
            }}>
                <Box sx={{padding: '20px 0', width: '99%', height: 'auto'}}>
                    <MessageInput
                        isScrolling={isScrolling}
                        scrollControl={scrollControl}
                        settings={store.settings}
                        setMessageInput={setMessageInput}
                        onSubmit={async (newUserMsg: Message, needGenerating = true) => {
                            if (needGenerating) {
                                const promptsMsgs = [...store.currentSession.messages, newUserMsg]
                                const newAssistantMsg = createMessage(
                                    OpenAIRoleEnum.Assistant,
                                    `<div style='width:100%;float:left;display:block'>&#x2003;${iconLib.waiting}</div>`,
                                    'html');
                                store.currentSession.messages = [...store.currentSession.messages, newUserMsg, newAssistantMsg]
                                store.updateChatSession(store.currentSession)
                                // console.log("newAssistantMsg  " + newAssistantMsg.content)
                                generate(store.currentSession, promptsMsgs, newAssistantMsg)
                                // if (store.settings.autoSpeech) handleSay(newAssistantMsg,store.settings.speech);
                                messageScrollRef.current = {msgId: newAssistantMsg.id, smooth: true}
                            } else {
                                store.currentSession.messages = [...store.currentSession.messages, newUserMsg]
                                store.updateChatSession(store.currentSession)
                                messageScrollRef.current = {msgId: newUserMsg.id, smooth: true}
                            }
                        }}
                    />
                </Box>
            </Grid>

            <SettingWindow open={openSettingWindow}
                           settings={store.settings}
                           save={(settings) => {
                               store.setSettings(settings)
                               setOpenSettingWindow(false)
                           }}
                           close={() => setOpenSettingWindow(false)}
            />
            {
                configureChatConfig !== null && (
                    <ChatConfigWindow open={configureChatConfig !== null}
                                      session={configureChatConfig}
                                      save={(session) => {
                                          store.updateChatSession(session)
                                          setConfigureChatConfig(null)
                                      }}
                                      close={() => setConfigureChatConfig(null)}
                    />
                )
            }
            {
                sessionClean !== null && (
                    <CleanWidnow open={sessionClean !== null}
                                 session={sessionClean}
                                 save={(session) => {
                                     sessionClean.messages.forEach((msg) => {
                                         msg?.cancel?.();
                                     });

                                     store.updateChatSession(session)
                                     setSessionClean(null)
                                 }}
                                 close={() => setSessionClean(null)}
                    />
                )
            }
            {
                store.toasts.map((toast) => (
                    <Snackbar
                        key={toast.id}
                        open
                        onClose={() => store.removeToast(toast.id)}
                        message={toast.content}
                        anchorOrigin={{vertical: 'top', horizontal: 'right'}}
                    />
                ))
            }
        </Box>
    );
}

interface RecognitionEvent {
    results: SpeechRecognitionResultList[][];
}

function MessageInput(props: {
    isScrolling: boolean
    scrollControl(): void
    settings:Settings
    onSubmit: (newMsg: Message, needGenerating?: boolean) => void
    setMessageInput: (value: string) => void
}) {
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();
    const [isTalking, setIsTalking] = React.useState(false)


    const {t} = useTranslation()
    // const {setMessageInput} = props
    const [nmessageInput, setNmessageInput] = React.useState("")
    const submit = (needGenerating = true) => {
        if (isTalking) {
            if (transcript.length === 0) {
                return;
            }
            props.setMessageInput(transcript)
            SpeechRecognition.stopListening();
            setIsTalking(false);
            props.onSubmit(createMessage('user', transcript), needGenerating)
            resetTranscript()
            props.setMessageInput('')
            setNmessageInput('')
            return;
        }
        if (nmessageInput.length === 0) {
            return;
        }
        props.setMessageInput(nmessageInput)
        props.onSubmit(createMessage('user', nmessageInput), needGenerating)
        resetTranscript()
        props.setMessageInput('')
        setNmessageInput('')
    }
    // let isTalking=false;
    const talking = () => {
        if (isTalking) {
            props.setMessageInput(transcript)
            SpeechRecognition.stopListening();
            setIsTalking(false);
            return;
        }
        resetTranscript()
        SpeechRecognition.startListening({language: props.settings.language, continuous: true})
        setIsTalking(true)
        return;
    }
    return (
        <form onSubmit={(e) => {
            e.preventDefault()
            submit()
        }}>
            <Grid container>
                <Grid item xs={12}>{
                    isTalking ? (
                            <TextField
                                multiline
                                id="isTalking"
                                label="Prompt"
                                value={transcript}
                                // onChange={(event) => setMessageInput(event.target.value)}
                                fullWidth
                                maxRows={12}
                                autoFocus
                                // id='message-input'
                                onKeyDown={(event) => {
                                    if (event.keyCode === 13 && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
                                        event.preventDefault()
                                        submit()
                                        return
                                    }
                                    if (event.keyCode === 13 && event.ctrlKey) {
                                        event.preventDefault()
                                        submit(false)
                                        return
                                    }
                                }}
                            />) :
                        (
                            <TextField
                                multiline
                                label="Prompt"
                                value={nmessageInput}
                                onChange={(event) => setNmessageInput(event.target.value)}
                                fullWidth
                                maxRows={12}
                                autoFocus
                                id='message-input'
                                onKeyDown={(event) => {
                                    if (event.keyCode === 13 && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
                                        event.preventDefault()
                                        submit()
                                        return
                                    }
                                    if (event.keyCode === 13 && event.ctrlKey) {
                                        event.preventDefault()
                                        submit(false)
                                        return
                                    }
                                }}
                            />)
                }
                </Grid>
                <Grid container style={{justifyContent: "right"}}>
                    <Grid item xs={6} justifySelf="left">
                        <Typography variant='caption'
                                    style={{opacity: 0.3}}>{t('[Enter] send, [Shift+Enter] line break')}</Typography>
                        <Typography variant='caption'
                                    style={{opacity: 0.3}}>{t('[Ctrl+Enter] send without generating')}</Typography>
                    </Grid>
                    <Grid item xs={6} style={{justifyContent: "right", display: 'flex'}}>
                        <IconButton size='large' color='primary' disabled={!isTalking && listening}
                                    onClick={props.scrollControl}>
                            {
                                props.isScrolling ? (
                                    <StopCircleOutlinedIcon/>
                                ) : (
                                    <RestartAltOutlinedIcon/>
                                )
                            }
                        </IconButton>
                        {
                        props.settings.autoSpeech &&(
                        <AutoSpeechControlUnit speech={props.settings.speech} autoSpeech={props.settings.autoSpeech}/>)
                        }
                        <IconButton size='large' color='primary' disabled={!isTalking && listening}
                                    onClick={talking}>
                            {
                                listening ? (
                                    <MicOffOutlinedIcon/>
                                ) : (
                                    <MicNoneOutlinedIcon/>
                                )
                            }
                        </IconButton>
                        <IconButton size='large' color='primary' type='submit'>
                            <SendOutlinedIcon/>
                        </IconButton>
                    </Grid>
                </Grid>
            </Grid>

        </form>
    )
}
export default function App() {
    return (
        <ThemeSwitcherProvider>
            <Main/>
        </ThemeSwitcherProvider>
    )
}
