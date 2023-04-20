import {Box, Divider, IconButton, Toolbar, Typography} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import SaveAsIcon from '@mui/icons-material/SaveAs';
import TurndownService from 'turndown'
import cheerio from 'cheerio'
import React from "react";
import {Session} from "@/src/types";
import {Store} from "@/src/store";

interface Props {
    leftSideBarVisible: boolean
    setLeftSideBarVisible: (arg0: boolean) => void
    setRightContentWidth: (width: string) => void
    setSessionClean: (session: Session | null) => void
    editCurrentSession: () => void
    store: Store
}

export default function AppToolBar(props: Props) {
    const exportToMarkdownFile = ()=>{
        // 读取 HTML 文件内容
        let html = (document.getElementById('chatcontent') as HTMLElement).outerHTML;
        // 将 HTML 解析为 DOM 树
        const $ = cheerio.load(html);
        $('.copy-action').text('');
        const newcontent= $('.chattips').text('');
        // 初始化 Markdown 转换服务
        const turndownService = new TurndownService();
        html = $.html()
        // console.log(html);
        // 遍历 DOM 树并将标记转换为 Markdown 语法
        let markdown = '';
        // $('body').children().each(function () {
        markdown += turndownService.turndown(html as string);
            // turndown 方法的参数必须为字符串，所以我们需要先将元素嵌套在一个 div 中
        // });

        // 将生成的 Markdown 写入文件
        const date = new Date();
        const formats = {
            yyyy: date.getFullYear(),
            M: date.getMonth() + 1,
            d: date.getDate(),
            HH: date.getHours(),
            mm: date.getMinutes(),
            ss: date.getSeconds(),
            // SSS:date.getMilliseconds()
        };
        let dateStr = `${formats.yyyy}${formats.M}${formats.d}${formats.HH}${formats.mm}${formats.ss}`;
        let filename: string = dateStr + '.md';

        // @ts-ignore
        if (typeof window.cordova !== "undefined" || typeof window.PhoneGap !== "undefined") {
            // const filename = 'example.txt';
            //cordova.file.dataDirectory
            const dataDir="file:///storage/emulated/0/Download/"
            // @ts-ignore
            window.resolveLocalFileSystemURL(dataDir, function (dirEntry) {
                // @ts-ignore
                dirEntry.getFile(filename, { create: true, exclusive: false }, function (file) {
                    // @ts-ignore
                    var fileWriter = new FileWriter();
                    file.createWriter(function (fileWriter: { write: (arg0: Blob) => void; }) {
                        const markdownBlob = new Blob([markdown], { type: 'text/plain' });
                        // const dataBlob = new Blob(['Hello World!'], { type: 'text/plain' });
                        fileWriter.write(markdownBlob);
                        // @ts-ignore
                        // console.log(cordova.file.dataDirectory);
                        // console.log(file.fullPath);
                        // @ts-ignore
                        props.store.addToast(dataDir+filename);

                        // import { FileOpener } from '@ionic-native/file-opener/ngx';

                        // const { FileOpener } = require('@ionic-native/file-opener');
                        // const fileOpener = new FileOpener();
                        // // @ts-ignore
                        // fileOpener.open(cordova.file.dataDirectory, 'application/vnd.android.package-archive')
                        //     .then(() => console.log('FileOpener:File opened successfully'))
                        //     // @ts-ignore
                        //     .catch(err => console.error('FileOpener:Error opening file', err));

                        // const fileURL = URL.createObjectURL(file);
                        // console.log(fileURL);
                        return;
                    });
                });
            });
        }
        const markdownBlob = new Blob([markdown], { type: 'text/plain' });
        let url = URL.createObjectURL(markdownBlob)

        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
    }
    return (
        <Box>
            <Toolbar variant="dense">
                {props.leftSideBarVisible ? (
                    <IconButton onClick={() => {
                        props.setLeftSideBarVisible(false);
                        // setRightContentWidth("fit-content")
                        }}
                        edge="end" color="inherit"
                        aria-label="menu" sx={{mr: 2}}>
                        <ArrowBackIosNewIcon/>
                    </IconButton>
                ) : (
                    <IconButton onClick={() => {
                        props.setLeftSideBarVisible(true);
                        props.setRightContentWidth("min-content")
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
                        props.editCurrentSession()
                        }} style={{cursor: 'pointer'}}>
                        {props.store.currentSession.name}
                    </span>
                </Typography>
                <IconButton edge="start"
                    color="inherit" aria-label="export" sx={{mr: 1}}
                    onClick={() =>{
                        exportToMarkdownFile()
                    }
                }
                >
                    <SaveAsIcon/>
                </IconButton>
                <IconButton edge="start"
                    color="inherit" aria-label="menu" sx={{mr: 1}}
                    onClick={() => props.setSessionClean(props.store.currentSession)}
                >
                    <CleaningServicesIcon/>
                </IconButton>
            </Toolbar>
            <Divider/>
        </Box>
    )
}