const socket = io()

// Elements
const $messageForm = document.querySelector('#sendMessage')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const positionShareTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
  const $newMessage = $messages.lastElementChild

  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  const visibleHeight = $messages.offsetHeight

  const containerHeight = $messages.scrollHeight
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (Math.round(containerHeight - newMessageHeight - 1) <= Math.round(scrollOffset)) {
    $messages.scrollTop = $messages.scrollHeight
  }
}
const vh = window.innerHeight * 0.01
document.documentElement.style.setProperty('--vh', `${vh}px`)

socket.on('locationMessage', (urlmessage) => {
  const link = Mustache.render(positionShareTemplate, {
    username: urlmessage.username,
    url: urlmessage.url,
    createdAt: moment(urlmessage.createdAt).format('h:mm:ss a')
  })
  $messages.insertAdjacentHTML('beforeend', link)
  autoscroll()
})
socket.on('message', (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm:ss a')
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})
socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault()

  $messageFormButton.setAttribute('disabled', 'disabled')
  const message = e.target.elements.message.value

  socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value = ''
    $messageFormInput.focus()
    if (error) {
      return console.log(error)
    }
    console.log('the message was delivered')
  })
})

$sendLocationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Cannot share your geolocation by your browser. Please open it from an another browser')
  }

  $sendLocationButton.setAttribute('disabled', 'disabled')

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }, () => {
      console.log('location shared')
      $sendLocationButton.removeAttribute('disabled')
    })
  })
})

socket.emit('join', { username, room }, (error) => {
  if (error) {
    location.href = '/'
    alert(error)
  }
})
