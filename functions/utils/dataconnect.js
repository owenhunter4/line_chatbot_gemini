const admin = require("firebase-admin");
// Require gcloud
admin.initializeApp();
const db = admin.firestore();


const addHistory = async (data) => {
    const colletion = "history"
    const addRequest = await db.collection(colletion).doc().set(data);
    console.log(addRequest);
}

const memberAdd = async (event) => {
    const colletion = "members";
    if (event.type === 'follow') {
        const data = {
            userId: event.source.userId,
            eventType: event.type,
            time: new Date()
        };
        const addRequest = await db.collection(colletion).doc(event.source.userId).set(data);
        console.log(addRequest);
    } else {
        const updateRequest = await db.collection(colletion).doc(event.source.userId).set({ eventType: event.type, time: new Date() }, { merge: true });
        console.log(updateRequest);
    }
}
const memberGetActive = async () => {
    const colletion = "members";
    const members = [];
    const query = await db.collection(colletion).where('eventType', '==', 'follow').get();
    query.forEach((data) => {
        members.push(data.data().userId);
    });
    console.log(members);
    return members;

}

module.exports = { addHistory, memberAdd,memberGetActive };
