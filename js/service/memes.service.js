'use strict'

let gMeme = null
let gDraws = []
let gCurrContainer = null
let gCurrDraw = null

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

function addDraw(element, id, drawFunc) {
    const newContainer = {element, id, draw: drawFunc}
    gDraws.push(newContainer)
    gCurrContainer = newContainer
}

function getCurrContainer() {
    return gCurrContainer
}