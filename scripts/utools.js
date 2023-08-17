// utools处理
utools.onPluginEnter(action => {
    if (action.code !== 'file') {
        return;
    }
    const path = action.payload[0].path;


    hideDropZone();
    showLoadingScreen();
    hideContent();

    console.log('开始读取文件：', path)

    window.preload.readFile(path)
        .then(buffer => {
            console.log('读取完成，开始解码')
            // Detect encoding

            let tempBuffer = new Uint8Array(buffer.buffer.slice(0, encodingLookupByteLength));
            while (tempBuffer.byteLength < encodingLookupByteLength) {
                // make copies of tempBuffer till it is more than 1000 bytes
                tempBuffer = new Uint8Array([...tempBuffer, ...tempBuffer]);
            }
            const text = String.fromCharCode.apply(null, tempBuffer);
            const detectedEncoding = jschardet.detect(text).encoding || "utf-8";

            console.log('Encoding:', detectedEncoding);

            // Get file content
            const decoderOptions = { stream: true, fatal: true };
            const decoder = new TextDecoder(detectedEncoding);
            var contents = decoder.decode(buffer.buffer, decoderOptions);
            console.log('读取')
            console.log(buffer)
            console.log(buffer, buffer.buffer, contents);
            fileContentChunks = contents.split("\n").filter(Boolean).filter(n => n.trim() !== '');
            totalPages = Math.ceil(fileContentChunks.length / itemsPerPage);

            // Detect language
            isEasternLan = getLanguage(fileContentChunks.slice(0, 50).join("\n"));
            console.log("isEasternLan: ", isEasternLan);
            // Change UI language based on detected language
            if (isEasternLan) {
                style.ui_LANG = "CN";
            } else {
                style.ui_LANG = "EN";
            }
            // Set fonts based on detected language
            // style.fontFamily_title = eval(`style.fontFamily_title_${style.ui_LANG}`);
            // style.fontFamily_body = eval(`style.fontFamily_body_${style.ui_LANG}`);
            style.fontFamily_title = style.ui_LANG === "CN" ? style.fontFamily_title_CN : style.fontFamily_title_EN;
            style.fontFamily_body = style.ui_LANG === "CN" ? style.fontFamily_body_CN : style.fontFamily_body_EN;

            // Get book name and author
            filename = window.preload.basename(path);
            bookAndAuthor = getBookNameAndAuthor(filename.replace(/(.txt)$/i, ''));
            console.log("BookName: ", bookAndAuthor.bookName);
            console.log("Author: ", bookAndAuthor.author);

            // Get all titles and process all footnotes
            allTitles.push([((style.ui_LANG === "EN") ? "TITLE PAGE" : "扉页"), 0]);
            titlePageLineNumberOffset = (bookAndAuthor.author !== "") ? 3 : 2;
            for (var i in fileContentChunks) {
                if (fileContentChunks[i].trim() !== '') {
                    // get all titles
                    tempTitle = getTitle(fileContentChunks[i]);
                    if (tempTitle !== "") {
                        allTitles.push([tempTitle, (parseInt(i) + titlePageLineNumberOffset)]);
                    }

                    // process all footnotes
                    fileContentChunks[i] = makeFootNote(fileContentChunks[i], `images/note_${style.ui_LANG}.png`);
                }
            }
            // console.log(allTitles);
            // tocContainer.innerHTML = processTOC_bak();
            processTOC();
            // setMainContentUI();

            // Add title page
            let sealRotation = (style.ui_LANG === "EN") ? `transform:rotate(${randomFloatFromInterval(-50, 80)}deg)` : "";
            // fileContentChunks.unshift(`<div id=line${(titlePageLineNumberOffset - 1)} class='prevent-select seal'><img id='seal_${style.ui_LANG}' src='images/seal_${style.ui_LANG}.png' style='left:calc(${randomFloatFromInterval(0, 1)} * (100% - ${eval(`style.seal_width_${style.ui_LANG}`)})); ${sealRotation}'/></div>`);
            fileContentChunks.unshift(`<div id=line${(titlePageLineNumberOffset - 1)} class='prevent-select seal'><img id='seal_${style.ui_LANG}' src='images/seal_${style.ui_LANG}.png' style='left:calc(${randomFloatFromInterval(0, 1)} * (100% - ${style.ui_LANG === 'CN' ? style.seal_width_CN : style.seal_width_EN})); ${sealRotation}'/></div>`);
            if (bookAndAuthor.author !== "") {
                fileContentChunks.unshift(`<h1 id=line1 style='margin-top:0; margin-bottom:${(parseFloat(style.h1_lineHeight) / 2)}em'>${bookAndAuthor.author}</h1>`);
                fileContentChunks.unshift(`<h1 id=line0 style='margin-bottom:0'>${bookAndAuthor.bookName}</h1>`);
            } else {
                fileContentChunks.unshift(`<h1 id=line0 style='margin-bottom:${(parseFloat(style.h1_lineHeight) / 2)}em'>${bookAndAuthor.bookName}</h1>`);
            }

            // Update the title of webpage
            document.title = bookAndAuthor.bookName;

            // Show content
            init = false;
            showCurrentPageContent();
            generatePagination();
            updateTOCUI(false);
            GetScrollPositions(toSetHistory = false);

            // Retrieve reading history if exists
            // removeAllHistory();    // for debugging
            let curLineNumber = getHistory(filename);
            if ((currentPage === 1) && (curLineNumber === 0) && (window.scrollY === 0)) {
                // if the first line is a header, it will show up in TOC
                setTitleActive(curLineNumber);
            }
        })
        .catch(e => {
            if (!utools.isDev()) {
                alert(e.message);
            }
            console.error(e);
        })
        .finally(() => {
            hideDropZone();
            hideLoadingScreen();
            showContent();
        })
})