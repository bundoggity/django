document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views


  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#emails-container').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-container').style.display = 'none';
  // get fields  
  const recipients = document.querySelector('#compose-recipients')
  const subject = document.querySelector('#compose-subject')
  const contents = document.querySelector('#compose-body')
  const submit = document.querySelector('#submit')
  // Clear out composition fields
  recipients.value = '';
  subject.value = '';
  contents.value = '';
  submit.disabled = true
  // onsubmit form
  document.querySelector('#compose-form').onsubmit = function() {
    // validate forms
    // POST email
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients.value,
        subject: subject.value,
        body: contents.value,
      })
    })
    .then(response => response.json())
    .then(result => {
      load_mailbox('sent')
    })
    .catch(error => {
      console.log('Error', error)
    })
    return false
  };

  document.querySelectorAll('.form-control').forEach(function(input){
    input.onkeyup = () => {
      if (recipients.value.length == 0 || subject.value.length == 0 || contents.value.length == 0 ){
        submit.disabled = true
      } else {
        submit.disabled = false
      }
    }
  });

}

// load / render a specific email
function load_mail(id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#emails-container').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-container').style.display = 'block';
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#email-heading').innerHTML =
     `
     <b>From</b>: ${email.sender},<br>
     <b>To</b>: ${email.recipients},<br>
     <b>Subject</b>: ${email.subject}, <br>
     ${email.timestamp}
    `;
    document.querySelector('#email-body').innerHTML = email.body;
    // create archive / reply button

    const replybutton = document.createElement("button");
    replybutton.setAttribute('class', "btn btn-sm btn-outline-primary");
    replybutton.innerHTML = "Reply";
    const archivebutton = document.createElement("button");
    archivebutton.setAttribute('class', "btn btn-sm btn-outline-primary");
    if (email.archived) {
      // email is archived
      archivebutton.innerHTML = "Unarchive";
    } else {
      // is not archived
      archivebutton.innerHTML = "Archive";
    }

    replybutton.onclick = function(){
      compose_email()
      const recipients = document.querySelector('#compose-recipients')
      const subject = document.querySelector('#compose-subject')
      const contents = document.querySelector('#compose-body')
      recipients.value = email.recipients;
      // create subject string
      if (!email.subject.startsWith("Re:")){
        subject.value = "Re: " + email.subject;
      }
      else {
        subject.value = email.subject
      }
      contents.value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`

    }

    archivebutton.onclick = function(){
      fetch(`/emails/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          archived: !email.archived
        })
      })
      .then(res => {
        load_mailbox("inbox")
      })
      
    }
    document.querySelector('#archive-container').innerHTML = ''
    document.querySelector('#archive-container').append(replybutton)
    document.querySelector("#archive-container").append(archivebutton)
    
  })

  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true
    })
  })
  .catch(error => {
    console.log(error)
  })

}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#emails-container').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-container').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  // remove current emails before re-displaying
  const email_list = document.querySelector('#emails-list')
  email_list.innerHTML = "";

  // fetch mailbox by name
  fetch(`emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // loop through fetched emails
    emails.forEach(function(email){
      const email_container = document.createElement('tr');
      email_container.id = "email"

      const sender = document.createElement('td');
      sender.innerHTML = email.sender;

      const subject = document.createElement('td');
      subject.innerHTML = email.subject;


      const timestamp = document.createElement('td');
      timestamp.innerHTML = email.timestamp;
      email_container.append(sender, subject, timestamp)
  
      //display color of unread / read email

      if (email.read){
        email_container.setAttribute("class", "table-secondary")
      } else {
        email_container.setAttribute("class", "table-default")
      }
      
      email_container.onclick = function() {
        console.log(email.id)
        load_mail(email.id)
      }

      document.querySelector('#emails-list').append(email_container)
      
    });


  });
}