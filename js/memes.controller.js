'use strict'

let gCanvas
let gCtx
let gCanvasCopy
let gCtxCopy
let gMouseDown = false
let gCount = 0
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
    window.addEventListener('keydown', onKeyDown)
    createGallery()
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

function onDownload(desiredRatio = getRatio()) {
    onDrawMeme()
    const elDownload = document.getElementById('download')
    const ratio = desiredRatio / getRatio()
    let img = new Image()
    img.onload = () => {
        gCanvasCopy.width = gCanvasCopy.width * ratio
        gCanvasCopy.height = gCanvasCopy.height * ratio
        drawImage(img, gCanvasCopy.width / 2, gCanvasCopy.height / 2, ratio, gCtxCopy)
        const url = gCanvasCopy.toDataURL('image/jpeg')
        elDownload.href = url
        elDownload.click()
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
    const captionContainer =
        `<section id="caption-container${gCount}" class="caption-container flex flex-column align-center">
    <div class="move" id="move${gCount}" onmousedown="onMouseDown(this)" style="background-image: url('images/move.png');"></div>
    <div id="canvas-text${gCount}" role="textbox" contenteditable="true" class="canvas-text"
        oninput="updateForm(this)" onclick="updateForm(this); setCurrContainer(this)">Enter Caption</div>
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
    _setContext(elCapt, desiredRatio)
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

function onMouseDown() {
    gMouseDown = true
    const container = getCurrContainer().element
    gMoveDif.x = parseFloat(container.offsetLeft) - gPos.x
    gMoveDif.y = parseFloat(container.offsetTop) - gPos.y
}

function onMouseUp() {
    gMouseDown = false
}

function onMouseMove(ev, ratio = getRatio()) {
    gPos.x = ev.x
    gPos.y = ev.y
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
    const elGallery = document.querySelector('.image-gallery')
    for (let i = 1; i <= 27; i++) {
        elGallery.insertAdjacentHTML('beforeend', createImageHTML(i))
        const newElImg = document.getElementById(`image${i}`)
        loadLocalImg(`images/${i}.jpg`, newElImg)
    }
}

function onClickHome() {
    onResetMeme()
    document.querySelector('.main-gallery').classList.remove('hide')
    document.querySelector('.editor').classList.add('hide')
    window.removeEventListener('resize', onResize)
    window.removeEventListener('mouseup', onMouseUp)
}

function onResetMeme() {
    const draws = getDraws()
    for (const draw of draws) {
        draw.element.remove()
    }
    document.querySelector('.settings-container').reset()
    gCount = 0
    resetMeme()
}

function onSelectImage(imgId) {
    createMeme(gImages[imgId])
    document.querySelector('.main-gallery').classList.add('hide')
    document.querySelector('.editor').classList.remove('hide')
    window.addEventListener('resize', onResize)
    window.addEventListener('mouseup', onMouseUp)
    onResize()
}

function createImageHTML(id) {
    return `<li class="image-container hide"
            id="image${id}" onclick="onSelectImage(this.id)"></li>`
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
    const currId = getCurrContainer().id
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