document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Handle the submission
  document.querySelector('#compose-form').onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id) {
  // Hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  
  // Mark email as read
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ read: true })
  });

  // Show email details
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      const view = document.querySelector('#email-view');
      view.innerHTML = `
        <h3>${email.subject}</h3>
        <p><strong>From:</strong> ${email.sender}</p>
        <p><strong>To:</strong> ${email.recipients}</p>
        <p><strong>Timestamp:</strong> ${email.timestamp}</p>
        <hr>
        <p>${email.body}</p>
      `;

      // Archive button
      const archive_button = document.createElement('button');
      archive_button.className = 'btn btn-sm btn-outline-primary';
      archive_button.innerText = email.archived ? 'Unarchive' : 'Archive';
      archive_button.addEventListener('click', () => {
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ archived: !email.archived })
        })
        .then(() => load_mailbox('inbox'));  // reload inbox after action
      });

      view.append(archive_button);

      // Reply button
      const reply_button = document.createElement('button');
      reply_button.className = 'btn btn-sm btn-outline-success ml-2';
      reply_button.innerText = 'Reply';
      reply_button.addEventListener('click', ()=> {
        compose_email();

        // Prefill fields
        document.querySelector('#compose-recipients').value = email.sender;
        document.querySelector('#compose-subject').value = email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`;
        document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}\n\n`;
      });
      view.append(reply_button);
    });
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Search emails fro the mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
        // Div for each email
        const email_div = document.createElement('div');
        email_div.className = 'email-item';
        email_div.innerHTML = `
          <strong>${email.sender}</strong> - ${email.subject}
          <span style="float: right;">${email.timestamp}</span>
        `;

        email_div.style.border = '1px solid #ccc';
        email_div.style.padding = '10px';
        email_div.style.margin = '5px';
        email_div.style.backgroundColor = email.read ? '#f0f0f0' : 'white';
        email_div.style.cursor = 'pointer';

        // Add click event
        email_div.addEventListener('click', () => view_email(email.id));
        document.querySelector('#emails-view').append(email_div);
    });
  });
}

function send_email(event) {
  event.preventDefault();

  // Collect form data
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  
  // Send POST request
  fetch('/emails', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);   // Debugging
    load_mailbox('sent');  // Redirect to Sent mailbox
  });
}
