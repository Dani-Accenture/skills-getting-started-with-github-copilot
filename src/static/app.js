document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        // mark card with activity name for later lookup
        activityCard.setAttribute("data-activity", name);

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHtml = (details.participants && details.participants.length)
          ? `<div class="activity-participants">
               <div class="participants-heading"><strong>Participants</strong></div>
               <ul class="participants-list">
                 ${details.participants.map(p => `
                   <li class="participant-item">
                     <span class="participant-email">${p}</span>
                     <button class="participant-remove" data-email="${p}" title="Unregister">✕</button>
                   </li>
                 `).join("")}
               </ul>
             </div>`
          : `<p class="no-participants"><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="spots-left">${spotsLeft}</span> spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Attach remove handlers for each participant button
        const removeButtons = activityCard.querySelectorAll(".participant-remove");
        removeButtons.forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const email = btn.getAttribute("data-email");
            btn.disabled = true;
            try {
              const resp = await fetch(
                `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );

              const result = await resp.json();
              if (resp.ok) {
                const li = btn.closest(".participant-item");
                if (li) li.remove();

                const spotsEl = activityCard.querySelector(".spots-left");
                if (spotsEl) {
                  const current = parseInt(spotsEl.textContent, 10);
                  spotsEl.textContent = (isNaN(current) ? 0 : current + 1);
                }

                messageDiv.textContent = result.message || "Unregistered successfully";
                messageDiv.className = "success";
              } else {
                messageDiv.textContent = result.detail || "Failed to unregister";
                messageDiv.className = "error";
                btn.disabled = false;
              }
            } catch (err) {
              console.error("Error unregistering:", err);
              messageDiv.textContent = "Failed to unregister. Please try again.";
              messageDiv.className = "error";
              btn.disabled = false;
            }

            messageDiv.classList.remove("hidden");
            setTimeout(() => messageDiv.classList.add("hidden"), 4000);
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Update the activity card in-place so the user sees the new participant
        addParticipantToCard(activity, email);
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  
  // Helper: add a participant to the corresponding activity card in the DOM
  function addParticipantToCard(activityName, email) {
    const cards = activitiesList.querySelectorAll('.activity-card');
    const card = Array.from(cards).find(c => c.getAttribute('data-activity') === activityName || (c.querySelector('h4') && c.querySelector('h4').textContent === activityName));
    if (!card) return;

    const attachRemoveHandler = (btn, cardRef) => {
      btn.addEventListener('click', async () => {
        const em = btn.getAttribute('data-email');
        btn.disabled = true;
        try {
          const resp = await fetch(
            `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(em)}`,
            { method: 'DELETE' }
          );
          const r = await resp.json();
          if (resp.ok) {
            const li = btn.closest('.participant-item');
            if (li) li.remove();
            const spotsEl = cardRef.querySelector('.spots-left');
            if (spotsEl) {
              const current = parseInt(spotsEl.textContent, 10);
              spotsEl.textContent = (isNaN(current) ? 0 : current + 1);
            }
            messageDiv.textContent = r.message || 'Unregistered successfully';
            messageDiv.className = 'success';
          } else {
            messageDiv.textContent = r.detail || 'Failed to unregister';
            messageDiv.className = 'error';
            btn.disabled = false;
          }
        } catch (err) {
          console.error('Error unregistering:', err);
          messageDiv.textContent = 'Failed to unregister. Please try again.';
          messageDiv.className = 'error';
          btn.disabled = false;
        }
        messageDiv.classList.remove('hidden');
        setTimeout(() => messageDiv.classList.add('hidden'), 4000);
      });
    };

    const ul = card.querySelector('.participants-list');
    if (ul) {
      const li = document.createElement('li');
      li.className = 'participant-item';
      const span = document.createElement('span');
      span.className = 'participant-email';
      span.textContent = email;
      const btn = document.createElement('button');
      btn.className = 'participant-remove';
      btn.setAttribute('data-email', email);
      btn.title = 'Unregister';
      btn.textContent = '✕';
      li.appendChild(span);
      li.appendChild(btn);
      ul.appendChild(li);
      attachRemoveHandler(btn, card);
    } else {
      // create new participants block
      const div = document.createElement('div');
      div.className = 'activity-participants';
      div.innerHTML = `
        <div class="participants-heading"><strong>Participants</strong></div>
        <ul class="participants-list">
          <li class="participant-item">
            <span class="participant-email">${email}</span>
            <button class="participant-remove" data-email="${email}" title="Unregister">✕</button>
          </li>
        </ul>
      `;
      const noP = card.querySelector('.no-participants');
      if (noP) noP.replaceWith(div);
      else card.appendChild(div);
      const btn = div.querySelector('.participant-remove');
      attachRemoveHandler(btn, card);
    }

    // decrement spots left
    const spotsEl = card.querySelector('.spots-left');
    if (spotsEl) {
      const current = parseInt(spotsEl.textContent, 10);
      const next = isNaN(current) ? 0 : Math.max(0, current - 1);
      spotsEl.textContent = next;
    }
  }

  // Initialize app
  fetchActivities();
});
