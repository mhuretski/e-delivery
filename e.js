const fetch = require('node-fetch')
const { JSDOM } = require('jsdom')
const TelegramBot = require('telebot')

const TELEGRAM_TOKEN = 'your token here'
const CHAT_ID = '-262580611'
const city = 'Минск'
const searchPeriod = 10 * 1000
const searchPeriodAfterSlotFound = 10 * 60 * 1000
const sleepPeriod = 60 * 60 * 1000
const workingHours = {
    from: 9,
    till: 23,
}

const bot = new TelegramBot(TELEGRAM_TOKEN)
function findSlot() {
    (async () => {
        const date = new Date()
        const hours = date.getHours()
        if  (hours < workingHours.till && hours > workingHours.from) {
            let elements = []
			try {
				const response = await fetch('https://e-dostavka.by/')
				const data = await response.text()
				const { document } = (new JSDOM(data)).window;
				elements = document.querySelectorAll('#float_cart .wrap_delivery_next .item')
			} catch(e) {
				console.log(e)
			}

			const result = Array.from(elements)
				.filter(e => {
					if(e && e.textContent && 
						e.textContent.includes(city) &&
						!e.textContent.includes('Доступное время отсутствует')
						) return e
				})
			if  (result.length > 0) {
				const message = result.map(item => {
					const nameElem = item.querySelector('a')
					const name = (nameElem) ? nameElem.textContent : ''
					const time = item.textContent.replace(name, '')
					return `[${name}, ${time}]`
				}).join(', ')
				bot.sendMessage(CHAT_ID, message)
	
				eTimer.setInterval(searchPeriodAfterSlotFound)
			} else {
				eTimer.setInterval(searchPeriod)
			}
		} else {
			eTimer.setInterval(sleepPeriod)
		}
    })().catch(e => console.log(e))
}

function timer() {
    const timer = {
        running: false,
        iv: 5000,
        timeout: false,
        cb: function() {},
        start: function(cb,iv,sd) {
            var elm = this;
            clearInterval(this.timeout)
            this.running = true
            if (cb) this.cb = cb
            if (iv) this.iv = iv
            if (sd) this.execute(elm)
            this.timeout = setTimeout(findSlot, this.iv)
        },
        execute: function(e) {
            if(!e.running) return false
            e.cb()
            e.start()
        },
        setInterval: function(iv) {
            clearInterval(this.timeout)
            this.start(false, iv)
        }
    }
    return timer
}

const eTimer = new timer()
eTimer.start(findSlot, searchPeriod, true)
