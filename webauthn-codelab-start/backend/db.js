import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync.js'


const adapter = new FileSync('./data/webauthn.json')
export const db = low(adapter)

const defaultDbStructure = {
	users: []
}

db.defaults(defaultDbStructure).write()

export const loadUser = username => db.get('users').find({username}).value()
export const addUser = (username, user) => db.get('users').push({username, ...user}).write()
// updates existing user with new fields. i.e. It does Object.assign internally
export const updateUser = (username, user) => db.get('users').find({username}).assign(user).write()
