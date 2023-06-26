'use strict'

let gCanvas
let gCtx
let gCanvasCopy
let gCtxCopy
let gMouseDown = false
let gCount = 0
let gPrevImg = null
const gImages = {}

const gPos = {
    x: 0,
    y: 0
}

const gMoveDif = {
    x: 0,
    y: 0,
}

const addMap = {
    caption: onAddCaption,
}

const drawMap = {
    caption: drawCaption,
}

const gCaptionStyles = ['font-family', 'font-size', 'color', '-webkit-text-stroke-color']

function onInit() {
    gCanvas = document.querySelector('#canvas')
    gCtx = gCanvas.getContext('2d')
    gCanvasCopy = document.querySelector('#canvas-copy')
    gCtxCopy = gCanvasCopy.getContext('2d')
    onmousemove = onMouseMove
    window.addEventListener('touchmove', onMouseMove)
    window.addEventListener('keydown', onKeyDown)
    createGallery()
    createSavedGallery()
}

function renderMeme(ratio = getRatio(), canvas = gCanvas) {
    const meme = getMeme()
    if (!meme) return
    drawMeme(meme, ratio, canvas)
}

function drawMeme(meme, ratio = getRatio(), canvas = gCanvas) {
    const ctx = canvas === gCanvas ? gCtx : gCtxCopy
    drawImage(meme.img, canvas.width / 2, canvas.height / 2, ratio, ctx)
    if (ctx !== gCtx) return
    const draws = getDraws()
    for (const draw of draws) {
        draw.element.style.left = draw.regX * ratio + 'px'
        draw.element.style.top = draw.regY * ratio + 'px'
        _getDrawById(draw.id).style['font-size'] = draw.fontSize * ratio + 'px'
    }
}

function drawImage(img, x, y, ratio = getRatio(), ctx = gCtx) {
    if (img) {
        x -= ratio * (img.width / 2)
        y -= ratio * (img.height / 2)
        ctx.drawImage(img, x, y, (ratio * img.width), (ratio * img.height))
    }
}

function onSaveMeme() {
    onDrawMeme()
    saveMeme(gCanvasCopy.toDataURL('image/jpeg'))
    alert('Saved!')
    createSavedGallery()
}

function onRemoveMeme(ev, id) {
    ev.stopPropagation()
    id = id.replace('X', '')
    removeMeme(id)
    createSavedGallery()
}

function onShowPreview() {
    onDrawMeme()
    const ratio = getRatio()
    let img = new Image()
    img.onload = () => {
        gPrevImg = img
        document.getElementById('resize').value = ratio
        document.querySelector('.modal-download').classList.remove('hide')
        document.querySelector('.editor').classList.add('hide')

    }
    img.src = gCanvasCopy.toDataURL('image/jpeg')
}

function closePreview() {
    document.querySelector('.modal-download').classList.add('hide')
    document.querySelector('.editor').classList.remove('hide')
}

function updatePreview(ratio) {
    gCanvasCopy.width = gPrevImg.width * ratio
    gCanvasCopy.height = gPrevImg.height * ratio
    drawImage(gPrevImg, gCanvasCopy.width / 2, gCanvasCopy.height / 2, ratio, gCtxCopy)
}

function onDownload() {
    const elDownload = document.getElementById('download')
    let img = new Image()
    img.onload = () => {
        const url = gCanvasCopy.toDataURL('image/jpeg')
        elDownload.href = url
        elDownload.click()
        closePreview()
    }
    img.src = gCanvasCopy.toDataURL('image/jpeg')
}

function onDrawMeme() {
    const curRatio = getRatio()
    onResize(null, curRatio, gCanvasCopy)
    for (const draw of getDraws()) {
        if (!draw || !draw.type) continue
        drawMap[draw.type](draw)
    }
}

function onAddDraw(type) {
    addMap[type]()
    renderMeme()
}

function onRemoveDraw() {
    const container = getCurrContainer()
    if (!container) return
    let elContainer = container.element
    removeCurrContainer()
    elContainer.remove()
    elContainer = null
}

function onAddCaption(ratio = getRatio()) {
    const draw = _getCurrentDraw()
    if (draw && !draw.innerText) {
        onRemoveDraw()
    }
    const captionContainer =
        `<section id="caption-container${gCount}" class="caption-container flex flex-column align-center">
            <div class="move" id="move${gCount}" ontouchstart="onMouseDown(this)" onmousedown="onMouseDown(this)"></div>
            <div id="canvas-text${gCount}" role="textbox" contenteditable="true" class="canvas-text"
            oninput="updateForm(this)" onmousedown="updateForm(this); setCurrContainer(this)">Enter Caption</div>
        </section>`
    document.querySelector('.canvas-container').insertAdjacentHTML('beforeend', captionContainer)
    addDraw(document.getElementById(`caption-container${gCount}`), gCount, 'caption')
    const elContainer = getCurrContainer()
    elContainer.regX = (elContainer.offsetLeft / ratio)
    elContainer.regY = (elContainer.offsetTop / ratio)
    gCount++
    onSetSettings()
}

function drawCaption(container) {
    const elCapt = _getDrawById(container.id)
    _setContext(elCapt)
    const lines = _getCaptionLines(elCapt)
    const lineHeight = _getLineHeight(elCapt)
    const x = container.element.offsetLeft
    let y = container.element.offsetTop
    for (let line of lines) {
        gCtxCopy.fillText(line, x, y)
        gCtxCopy.strokeText(line, x, y)
        y += lineHeight
    }
}

function _getCaptionLines(elCapt) {
    const maxW = elCapt.offsetWidth + 0.5
    const words = elCapt.innerText.split(/(\s)/).filter(str => str)
    let lines = []
    let curLine = ''
    for (const word of words) {
        if (curLine && gCtxCopy.measureText(curLine + word).width > maxW) {
            lines.push(curLine)
            curLine = ''
        }
        for (let i = 0; i < word.length; i++) {
            if (gCtxCopy.measureText(curLine + word[i]).width > maxW) {
                lines.push(curLine)
                curLine = ''
            }
            curLine += word[i]
        }
    }
    if (curLine) {
        lines.push(curLine)
    }
    lines = lines.filter(line => line !== ' ')
    return lines
}

function _setContext(elCapt) {
    const fontSize = _getElFontSize(elCapt)
    gCtxCopy.lineWidth = 2
    gCtxCopy.strokeStyle = elCapt.style['-webkit-text-stroke-color']
    gCtxCopy.fillStyle = elCapt.style.color
    gCtxCopy.font = `${fontSize}px ${elCapt.style['font-family']}`
    gCtxCopy.textAlign = 'center'
    gCtxCopy.textBaseline = 'top'
}

function onMouseDown(elMove) {
    if (!elMove) return
    setCurrContainer(elMove)
    const drawContainer = getCurrContainer()
    updateForm(_getDrawById(drawContainer.id))
    const container = drawContainer.element
    gMouseDown = true
    gMoveDif.x = parseFloat(container.offsetLeft) - gPos.x
    gMoveDif.y = parseFloat(container.offsetTop) - gPos.y
}

function onMouseUp() {
    gMouseDown = false
}

function onMouseMove(ev, ratio = getRatio()) {
    if (ev.type.includes('touch')) {
        if (gMouseDown) {
            ev.preventDefault()
        }
        gPos.x = ev.touches[0].pageX
        gPos.y = ev.touches[0].pageY
    } else {
        gPos.x = ev.x
        gPos.y = ev.y
    }
    if (gMouseDown) {
        const drawContainer = getCurrContainer()
        const container = drawContainer.element
        const elDraw = _getCurrentDraw()
        const minX = parseFloat(elDraw.offsetWidth / 2)
        const maxY = parseFloat(elDraw.offsetHeight)
        const newPos = { x: gPos.x + gMoveDif.x, y: gPos.y + gMoveDif.y }
        if (isInRange(minX, gCanvas.width - minX, newPos.x)) {
            container.style.left = (newPos.x) + 'px'
            drawContainer.regX = newPos.x / ratio
        }
        if (isInRange(0, gCanvas.height - maxY, newPos.y)) {
            container.style.top = (newPos.y) + 'px'
            drawContainer.regY = newPos.y / ratio
        }
    }
}

function onSetSettings(form) {
    if (!getCurrContainer()) return
    if (!form) {
        form = document.querySelector('.settings-container')
    }
    const settings = new FormData(form)
    updateCaption(Object.fromEntries(settings))
}

function updateCaption(settings, ratio = getRatio()) {
    const container = getCurrContainer()
    container.fontSize = settings['font-size']
    settings['font-size'] *= ratio
    settings['font-size'] += 'px'
    const caption = _getCurrentDraw()
    if (caption) {
        for (let setting in settings) {
            if (setting === 'innerText') {
                caption[setting] = settings[setting]
            } else {
                caption.style.setProperty(setting, settings[setting])
            }
        }
    }
}

function updateForm(elCapt, ratio = getRatio()) {
    document.getElementById('innerText').value = elCapt.innerText
    document.getElementById('font-family').value = elCapt.style['font-family']
    document.getElementById('font-size').value = parseInt((elCapt.style['font-size'].replace('px', '') / ratio) + 0.1)
    document.getElementById('color').value = rgbToHex(elCapt.style.color)
    document.getElementById('-webkit-text-stroke-color').value = rgbToHex(elCapt.style['-webkit-text-stroke-color'])
}

function onResize(ev, ratio = updateRatio(window.innerWidth, window.innerHeight - 100), canvas = gCanvas) {
    const img = getMeme().img
    canvas.width = ratio * img.width
    canvas.height = ratio * img.height
    renderMeme(ratio, canvas)
}

function createGallery() {
    const elGallery = document.querySelector('.local-image-gallery')
    for (let i = 1; i <= 27; i++) {
        elGallery.insertAdjacentHTML('beforeend', createImageHTML(i))
        const newElImg = document.getElementById(`image${i}`)
        loadLocalImg(`images/${i}.jpg`, newElImg)
    }
}

function createSavedGallery() {
    loadSavedMemes()
    const savedMemes = getSavedMemes()
    if (!savedMemes) return
    const elGallery = document.querySelector('.saved-image-gallery')
    elGallery.innerHTML = ''
    for (const id in savedMemes) {
        elGallery.insertAdjacentHTML('beforeend', createSavedImgHTML(id))
        const newElImg = document.getElementById(id)
        loadLocalImg(savedMemes[id].drawnSrc, newElImg)
    }
}

function onToggleMenu() {
    document.querySelector(`.nav-links`).classList.toggle('shown')
    document.querySelector(`.btn-toggle-menu`).classList.toggle('shown')
}

function onClickHome() {
    onResetMeme()
    document.querySelector('.main-gallery').classList.remove('hide')
    document.querySelector('.modal-download').classList.add('hide')
    document.querySelector('.saved-gallery').classList.add('hide')
    document.querySelector('.editor').classList.add('hide')
    document.querySelector(`.nav-links`).classList.remove('shown')
    document.querySelector(`.btn-toggle-menu`).classList.remove('shown')
    window.removeEventListener('resize', onResize)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('touchend', onMouseUp)
}

function onClickSaved() {
    onResetMeme()
    document.querySelector('.saved-gallery').classList.remove('hide')
    document.querySelector('.modal-download').classList.add('hide')
    document.querySelector('.main-gallery').classList.add('hide')
    document.querySelector('.editor').classList.add('hide')
    document.querySelector(`.nav-links`).classList.remove('shown')
    document.querySelector(`.btn-toggle-menu`).classList.remove('shown')
    window.removeEventListener('resize', onResize)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('touchend', onMouseUp)
}

function onResetMeme() {
    const draws = getDraws()
    if (draws && draws.length) {
        for (let draw of draws) {
            draw.element.remove()
            draw = null
        }
    }
    document.querySelector('.settings-container').reset()
    gCount = 0
    resetMeme()
}

function onUploadImage(ev) {
    if (!(ev.target.files && ev.target.files[0])) return
    const reader = new FileReader()
    reader.onload = function (event) {
        let img = new Image()
        img.src = event.target.result
        img.onload = () => {
            gImages['upload'] = img
            onSelectImage('upload')
            ev.target.value = ''
        }
    }
    reader.readAsDataURL(ev.target.files[0])
}

function onSelectImage(imgId) {
    onResetMeme()
    createMeme(gImages[imgId])
    document.querySelector('.main-gallery').classList.add('hide')
    document.querySelector('.saved-gallery').classList.add('hide')
    document.querySelector('.editor').classList.remove('hide')
    document.querySelector(`.nav-links`).classList.remove('shown')
    document.querySelector(`.btn-toggle-menu`).classList.remove('shown')
    window.addEventListener('resize', onResize)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('touchend', onMouseUp)
    onResize()
}

function onSelectSavedImg(savedId) {
    const memeContainer = getMemeById(savedId)
    if (!memeContainer) return
    onResetMeme()
    const img = new Image()
    img.onload = () => {
        createMeme(img)
        for (const draw of memeContainer.draws) {
            document.querySelector('.canvas-container').insertAdjacentHTML('beforeend', draw.html)
            addDraw(document.getElementById(`caption-container${draw.id}`), draw.id, draw.type)
            if (draw.id >= gCount) {
                gCount = draw.id + 1
            }
            const container = getCurrContainer()
            container.regX = draw.regX
            container.regY = draw.regY
            container.fontSize = draw.fontSize
        }
        document.querySelector('.main-gallery').classList.add('hide')
        document.querySelector('.saved-gallery').classList.add('hide')
        document.querySelector('.editor').classList.remove('hide')
        window.addEventListener('resize', onResize)
        window.addEventListener('mouseup', onMouseUp)
        window.addEventListener('touchend', onMouseUp)
        onResize()
    }
    img.src = memeContainer.origSrc
}

function createImageHTML(id) {
    return `<li class="image-container hide"
            id="image${id}" onclick="onSelectImage(this.id)"></li>`
}

function createSavedImgHTML(id) {
    return `<li class="image-container hide"
            id="${id}" onclick="onSelectSavedImg(this.id)"><button id="X${id}" class="image-remove" title="Delete meme" onclick="onRemoveMeme(event, this.id)">X</button></li>`
}

function loadLocalImg(path, element, readyFunc = onImageReady) {
    const img = new Image()
    img.src = path
    img.onload = () => {
        if (element) {
            element.style['background-image'] = `url(${path})`
        }
        readyFunc(img, element)
    }
}

function onImageReady(img, element) {
    element.classList.remove('hide')
    gImages[element.id] = img
}

function onKeyDown(ev) {
    if (ev.keyCode == 13) {
        ev.preventDefault()
    }
}

function rgbToHex(strRGB) {
    let rbgNums = strRGB.replace('rgb(', '').replace(')', '').replace(',', '').split(' ')
    return `#${numToHex(parseInt(rbgNums[0]))}${numToHex(parseInt(rbgNums[1]))}${numToHex(parseInt(rbgNums[2]))}`
}

function numToHex(num) {
    const hex = num.toString(16)
    return hex.length === 1 ? '0' + hex : hex
}

function isInRange(min, max, num) {
    return num >= min && num <= max
}

function _getCurrentDraw() {
    const currContainer = getCurrContainer()
    if (!currContainer) return null
    const currId = currContainer.id
    return document.getElementById(`canvas-text${currId}`)
}

function _getDrawById(id) {
    return document.getElementById(`canvas-text${id}`)
}

function _getLineHeight(element, desiredRatio = getRatio()) {
    const ratio = desiredRatio / getRatio()
    const fontSize = (_getElFontSize(element) * ratio) + 'px'
    let temp = document.createElement(element.nodeName)
    temp.setAttribute("style", "margin: 0px; padding: 0px; font-family: " + element.style.fontFamily + "; font-size: " + fontSize) + ';'
    temp.innerHTML = "test"
    temp = element.parentNode.appendChild(temp)
    const ret = temp.clientHeight
    temp.parentNode.removeChild(temp)
    return ret
}

function _getElFontSize(element) {
    return element.style.fontSize.replace('px', '')
}