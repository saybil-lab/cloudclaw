

# Send Messages

Learn how to send messages with Unipile

*Feature available for :**LinkedIn, WhatsApp, Instagram, Messenger, Telegram***

# Send a message in an existing Chat / Group

Use the [`POST chats/{chat_id}/messages`](https://developer.unipile.com/reference/chatscontroller_sendmessageinchat) Method or use the appropriate SDK Method, to send a message by providing a `chat_id` you can find by retrieving chats lists, or when receiving a message to automate replies on Webhook trigger.

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/chats/9f9uio56sopa456s/messages \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: multipart/form-data' \
     --form 'text=Hello world !'
```

```javascript
const response = await client.messaging.sendMessage({
  chat_id: "9f9uio56sopa456s",
  text: "Hello world !"
})
```

> 📘
>
> If you want to send a message into an existing chat using an attendee identifier, you can read the next section, but if you have the choice, always prefer the usage of `chat_id`.

***

# Send a message to a User

There is two cases where you want to send a message to a User instead of in a Chat:

* You don't have access to the id of the existing chat
* The connected account does not have a conversation history this specific user, so there is no existing chat and you must start a new chat.

To send a message to a User, use the [`POST /chats`](https://developer.unipile.com/reference/chatscontroller_startnewchat) Method or the appropriate SDK Method.

In the `account_id` field, provide the ID of the connected account to send the message from. In the `attendees_ids` field, give one user's **Provider internal ID**. Please refer to those guides if you need more informations about Users and how their IDs work.

* [Users overview](https://developer.unipile.com/docs/users-overview)
* [Retrieving users](https://developer.unipile.com/docs/retrieving-users)

The method will send a message in a 1 to 1 chat, and:

* If the chat does not exist, it will be created, synced, and returned
* If the user was not an attendee yet, it will be synced

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/chats \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: multipart/form-data' \
     --form account_id=Yk08cDzzdsqs9_8ds \
     --form 'text=Hello world !' \
     --form attendees_ids=ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E \
```

```javascript SDK Node
const response = await client.messaging.startNewChat({
  account_id: 'Yk08cDzzdsqs9_8ds',
  text: 'Hello world !',
  attendees_ids: ["ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E"],
})
```

## LinkedIn specific use cases

With Linkedin, unless InMail, you can start new chats only with your Relations. You can use Unipile to invite people to be in your Relations : [Send a contact invitation](https://developer.unipile.com/reference/userscontroller_adduserbyidentifier)

If you have a Premium LinkedIn account and want to send InMails, set the `inmail` property to true in the payload. You have to consider the account type of user (with /me route or GET account) to use to good API (classic/recruiter/sales\_navigator)

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/chats \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: multipart/form-data' \
     --form account_id=Asdq-j08dsqQS89QSD \
     --form 'text=Hello world !' \
     --form attendees_ids=ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E \
     --form linkedin[api]=classic \
     --form linkedin[inmail]=true \
```

```javascript SDK Node
const response = await client.messaging.startNewChat({
  account_id: 'Yk08cDzzdsqs9_8ds',
  text: 'Hello world !',
  attendees_ids: ["ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E"],
  options: {
    linkedin: {
      api: 'classic',
      inmail: true
    }
  }
})
```

***

# Send attachments

You can provide an additional attachment to the request body to send attachments along your text message.

Limitations may vary depending on the provider, but the standard maximum size is 15MB. You can send documents in PDF, image, or video formats.

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/chats \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: multipart/form-data' \
     --form account_id=sSR22ds5dd_ds \
     --form 'text=Hello world !' \
     --form attendees_ids=ACoAAAcDMMQBODyLwZrRcgYhrkCafURGqva0U4E \
     --form 'attachments=@C:\Documents\cute_dog.png'
```

***

# Create a group chat

To start a new group chat, use the [`POST /chats`](https://developer.unipile.com/reference/chatscontroller_startnewchat) Method or the appropriate SDK Method and provider a list of user's **Provider internal ID** in `attendees_ids` along an optional `title` for the group name.

Please refer to those guides if you need more informations about Users and how their IDs work.

* [Users overview](https://developer.unipile.com/docs/users-overview)
* [Retrieving users](https://developer.unipile.com/docs/retrieving-users)

The chat and its group participants will be synced.

```curl
curl --request POST \
     --url https://{YOUR_DSN}/api/v1/chats \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json' \
     --header 'content-type: multipart/form-data' \
     --form account_id=k0_s8cdss9Dz8ds \
     --form 'text=Hello world !' \
     --form attendees_ids=33600000000@s.whatsapp.net \
     --form attendees_ids=33600000001@s.whatsapp.net \
     --form title=Vacation
```

***




# Message object

This section will explain in detail each field of the message object so you can properly integrate them in your application

## id

Unique identifier of the message for Unipile.

Can be used to prevent duplicate entries.

## chat\_id

Unique identifier of the parent chat for Unipile.

Can be used to retrieve the parent chat.

## provider\_id

Unique identifier of the message for the provider.

Can be use to reference the message in the native web app of the provider.

## chat\_provider\_id

Unique identifier of the parent chat for the provider.

Can be use to reference the chat in the native web app of the provider. For exemple, if you need a link "Open chat in LinkedIn".

## account\_id

Unique identifier of the parent account.

## text

Textual body of the message.

***Unipile does not support formatted text yet and will return plain text.***

## attachments

List of attachments.

## sender\_id

Unique identifier of the sender for the provider.

The format is specific to each provider, it can be a phone number, an email, a username or an ID.

Can be used to match attendees if any. In cases you don't have the attendee, you can still display this sender\_id to identify the sender.

<Image align="center" width="500px" src="https://files.readme.io/359372b-sender_id.png" />

## timestamp

Provider's server acknowledge datetime.

Can be used as message sent date.

<Image align="center" width="500px" src="https://files.readme.io/4234a93-timestamp.png" />

## is\_sender

Boolean telling if the message sender is the account's user or someone else.

Can be used to design a message bubble.

## seen

> Per provider support

If `is_sender` is true, Boolean telling if the message has been seen / read by at least one recipient.

If `is_sender` is false, Boolean telling if the message has been seen / read by the connected user, which can be the case if the message is get after being seen on another app or device.

## seen\_by

> Per provider support

List of message read receipts.

The key is the provider's user id, and the value can be a boolean telling if the message has been seen / read by this user, or a timestamp telling when it was seen / read.

## delivered

> Per provider support

Boolean telling if the message has been delivered to the recipient. Note that, depending on the provider, it does not guarantee that it's delivered to the recipient, but only to the provider's server.

## hidden

Boolean telling if the message should be hidden in the conversation view.

For exemple, messages of type "John reacted 👍 to your message" are hidden, but visible as last message in chat lists.

<Image align="center" width="800px" src="https://files.readme.io/3a08e4b-hidden.png" />

## deleted

Boolean telling if the message has been deleted.

Can be used to replace the content of a message by a generic "Message deleted"

## edited

> Per provider support

Boolean telling if the message has been edited.

## is\_event

Boolean telling the message is not an actual user message, but an event, specified by `event_type`.

## event\_type

If `is_event` is true, the type of event. Unipile support the following events :

* A user reacted to a message (`1`)
* A user reacted to owner message (`2`)
* The group was created (`3`)
* The group has changed title (`4`)
* A new participant was added to the group (`5`)
* A participant was removed from the group (`6`)
* A participant left the group (`7`)
* Missed voice call (`8`)
* Missed audio call (`9`)

Some providers shows other kinds of events. Unipile does not support them yet and will set `event_type` as `0`.

## reactions

A list of reactions to the message.

| key        | value                                                          |
| :--------- | :------------------------------------------------------------- |
| value      | The reaction, 👍 for exemple                                   |
| sender\_id | The provider's user id of who reacted                          |
| is\_sender | Boolean telling if the reaction was sent by the connected user |

## quoted

Quoted message details if any.

*Note that some providers (ex:WhatsApp) use the term "reply" in their UI, but Unipile prefer to use the term "quote" to distinguish it from threaded replies.*





# Retrieving messages

Learn how to retrieve messages of your connected accounts.

*Feature available for :**LinkedIn, WhatsApp, Instagram, Messenger, Telegram***

# Get message history of a chat

To get existing messages in a chat, use the [`GET`chats/\{chat\_id}/messages ](https://developer.unipile.com/reference/chatscontroller_listchatmessages) Method or the appropriate SDK Method with a valid `chat_id`.

Most recent messages will be returned first, ordered by date.

By default, the limit of returned messages is set to 100.

```curl
curl --request GET \
     --url https://{YOUR_DSN}/api/v1/chats/{CHAT_ID}/messages \
     --header 'X-API-KEY: {YOUR_ACCESS_TOKEN}' \
     --header 'accept: application/json'
```

```javascript
const response = await client.messaging.getAllMessagesFromChat({
  chat_id: "e9d087d67",
});
```

*This method use[pagination](https://developer.unipile.com/docs/api-usage).*

# Get new messages

Unipile's API give you two options to receive messages in your application

## In realtime with Webhooks

The recommended approach to listen for new messages in your application is by using a Webhook because they trigger in real time. Whenever the user account **receives** or **sends** a new message, the Webhook will call your specified URL with the given message that you can store to be displayed.

-> [More informations on new messages webhooks](https://developer.unipile.com/docs/new-messages-webhook)

## With a cron job

If your system cannot handle Webhooks, or if you don't need real time, you can create a cron job calling [`GET` /messages](https://developer.unipile.com/reference/messagescontroller_listallmessages) Method at interval.

*We advise fetching a larger period than your cron delay to account for any potential disconnects or errors that may result in losing outdated messages. In this case, implementing a unique ID verification on your history entry based on the message ID can help prevent duplicate entries.*