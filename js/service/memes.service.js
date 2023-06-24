'use strict'

let gMeme = null
let gDraws = []
let gCurrContainer = null
let gRatio = 1

function createMeme(img) {
    gMeme = {
        img,
        draws: gDraws
    }
    return gMeme
}

function getMeme() {
    return gMeme
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