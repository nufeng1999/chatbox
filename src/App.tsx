import React, { useRef} from 'react';
import Block from './Block'
import * as client from './client'
import {
    Box, Snackbar,
    List, Stack, Grid
} from '@mui/material';
import {isMobile} from "react-device-detect";
import {Session, createSession, Message, createMessage, Settings, OpenAIRoleEnum, OpenAIRoleEnumType} from './types'
import useStore, {Store} from './store'
import SettingWindow from './SettingWindow'
import ChatConfigWindow from './ChatConfigWindow'
import * as prompts from './prompts';
import CleanWidnow from './CleanWindow';
import {ThemeSwitcherProvider} from './theme/ThemeSwitcher';
import {useTranslation} from "react-i18next";
import {pushToAutoSpeedBuffer,} from "./Say";
import LeftSideBar from './leftside/LeftSideBar';
import AppToolBar from './topside/AppToolBar';
import iconLib from "./iconLib";
import SmartToyIcon from '@mui/icons-material/SmartToy';
import FaceIcon from '@mui/icons-material/Face';
import Face2Icon from '@mui/icons-material/Face2';
import Face3Icon from '@mui/icons-material/Face3';
import Face4Icon from '@mui/icons-material/Face4';
import Face5Icon from '@mui/icons-material/Face5';
import Face6Icon from '@mui/icons-material/Face6';
import Face4TwoToneIcon from '@mui/icons-material/Face4TwoTone';
import Face5TwoToneIcon from '@mui/icons-material/Face5TwoTone';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import EngineeringIcon from '@mui/icons-material/Engineering';
import CloudIcon from '@mui/icons-material/Cloud';
import SettingsSystemDaydreamIcon from '@mui/icons-material/SettingsSystemDaydream';
import SchoolIcon from '@mui/icons-material/School';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BottomBar from "./bottom/BottomBar";

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

    const assistantIconMap
        = {
        SmartToyIcon,
        FaceIcon,
        Face2Icon,
        Face3Icon,
        Face4Icon,
        Face5Icon,
        Face6Icon,
        ChildCareIcon,
        SelfImprovementIcon,
        EngineeringIcon,
        CloudIcon,
        SettingsSystemDaydreamIcon,
        SchoolIcon,
        VisibilityIcon,
        Face4TwoToneIcon,
        Face5TwoToneIcon
    }
    const getAssistantIcon = (iconName: string) => {
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
        const lastMsg = promptMsgs[promptMsgs.length - 1];
        if(lastMsg.createImg){
            await client.dall_e_Replay({
                apiKey:store.settings.openaiKey,
                host:store.settings.apiHost,
                maxContextSize:store.settings.maxContextSize,
                maxTokens:store.settings.maxTokens,
                modelName:session.model,
                msg:lastMsg.content,
                n: 1,
                size: "512x512",
                response_format: "url",
                onText:({text, frPos, cancel}):number => {
                        for (let i = 0; i < session.messages.length; i++) {
                            if (session.messages[i].id === targetMsg.id) {
                                session.messages[i] = {
                                    ...session.messages[i],
                                    format: "img",
                                    content: text,
                                    cancel,
                                }
                                break;
                            }
                        }
                        store.updateChatSession(session)
                        return frPos;
                    },
                onError:(err) => {
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
                }
            )
            messageScrollRef.current = null
            return
        }
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
            <AppToolBar
                leftSideBarVisible={leftSideBarVisible}
                setLeftSideBarVisible={setLeftSideBarVisible}
                setRightContentWidth={setRightContentWidth}
                setSessionClean={setSessionClean}
                editCurrentSession={editCurrentSession}
                store={store}
            />
            <Grid id="chatcontent" item xs={12} sx={{
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
                                           shareMsg={() => {
                                               // @ts-ignore
                                               if (typeof window.cordova !== "undefined") {
                                                   var options = {
                                                       message: msg.content,
                                                       subject: 'ChatAI',
                                                       // files: ['path/to/file'], // 可选项
                                                       // url: ''
                                                   };
                                                   // @ts-ignore
                                                   window.plugins.socialsharing.shareWithOptions(options, function (result) {
                                                           console.log('分享成功：' + result.completed);
                                                       },
                                                       // @ts-ignore
                                                       function (error) {
                                                           console.log('分享失败：' + error);
                                                       });
                                                   return
                                               }
                                               if (navigator.share) {
                                                   navigator.share({
                                                       title: 'ChatAI',
                                                       text: msg.content,
                                                   })
                                                       .then(() => console.log('共享成功。'))
                                                       .catch((err) => {
                                                           store.addToast(err)
                                                           console.log('共享失败：', err)
                                                       });
                                               }
                                           }}
                                           quoteMsg={() => {
                                               let input = msg.content.split('\n').map((line: any) => `> ${line}`).join('\n')
                                               input += '\n\n-------------------\n\n'
                                               setMessageInput(input)
                                           }}
                                    />)
                                }
                            )
                        }
                    </List>
                </Stack>

                {/*右边内容结束*/}
            </Grid>

            <BottomBar
                isScrolling={isScrolling}
                scrollControl={scrollControl}
                store={store}
                setMessageInput={setMessageInput}
                generate={generate}
                messageScrollRef={messageScrollRef}
            />

            <SettingWindow open={openSettingWindow}
                           settings={store.settings}
                           assistantIconMap={assistantIconMap}
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


export default function App() {
    return (
        <ThemeSwitcherProvider>
            <Main/>
        </ThemeSwitcherProvider>
    )
}
