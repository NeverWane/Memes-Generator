'use strict'

const SAVED_MEMES = 'memesDB'

let gMeme = null
let gSavedMemes = null
let gDraws = []
let gCurrContainer = null
let gRatio = 1

function createMeme(img) {
    gMeme = {
        img,
        draws: gDraws,
    }
    return gMeme
}

function getMeme() {
    return gMeme
}

function loadSavedMemes() {
    gSavedMemes = loadFromLocalStorage(SAVED_MEMES)
    if (!gSavedMemes) {
        gSavedMemes = {}
    }
}

function getSavedMemes() {
    if (!gSavedMemes) return null
    return gSavedMemes
}

function saveMeme(drawnSrc) {
    if (!gSavedMemes) {
        gSavedMemes = loadSavedMemes()
    }
    let id = 0
    for (const key in gSavedMemes) {
        if (key !== ('saved' + id)) {
            break
        }
        id++
    }
    id = 'saved' + id
    const draws = []
    for (const draw of gDraws) {
        draws.push({html: draw.element.outerHTML, id: draw.id, type: draw.type, regX: draw.regX, regY: draw.regY, fontSize: draw.fontSize})
    }
    gSavedMemes[id] = ({draws, drawnSrc, origSrc: gMeme.img.src})
    saveToLocalStorage(SAVED_MEMES, gSavedMemes)
}

function addDraw(element, id, type) {
    const newContainer = {element, id, type}
    gDraws.push(newContainer)
    gCurrContainer = newContainer
}

function removeCurrContainer() {
    gDraws = gDraws.filter(draw => {
        return draw !== gCurrContainer
    })
    gCurrContainer = null
}

function getDraws() {
    return gDraws
}

function getCurrContainer() {
    return gCurrContainer
}

function getMemeById(id) {
    return gSavedMemes[id]
}

function setCurrContainer(elText) {
    if (!elText) return
    const id = parseInt(elText.id.replace('canvas-text', ''))
    gCurrContainer = gDraws[gDraws.findIndex(draw => {
        return draw.id === id
    })]
}

function updateRatio(maxW, maxH) {
    const img = gMeme.img
    let newRatio = 1
    if (img.width > (0.8 * maxW)) {
        newRatio = (0.8 * maxW) / img.width
    }
    if ((img.height * newRatio) > (0.8 * maxH)) {
        newRatio = (0.8 * maxH) / img.height
    }
    gRatio = newRatio
    return gRatio
}

function resetMeme() {
    gMeme = null
    gCurrContainer = null
    gDraws = []
    gRatio = 1
}

function getRatio() {
    return gRatio
}