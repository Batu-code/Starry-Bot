const { getRuntime, saveRuntime } = require("../../data/store");

function listReminders() {
  return getRuntime("reminders", []);
}

function addReminder(reminder) {
  const current = listReminders();
  current.push(reminder);
  saveRuntime("reminders", current);
  return reminder;
}

function removeReminder(reminderId) {
  const current = listReminders().filter((item) => item.id !== reminderId);
  saveRuntime("reminders", current);
}

async function startReminderLoop(client) {
  setInterval(async () => {
    const reminders = listReminders();
    const due = reminders.filter((item) => item.triggerAt <= Date.now());

    for (const reminder of due) {
      const channel = await client.channels.fetch(reminder.channelId).catch(() => null);
      if (channel?.isTextBased()) {
        await channel.send({
          content: `<@${reminder.userId}> hatirlatma: ${reminder.message}`,
        }).catch(() => null);
      }

      removeReminder(reminder.id);
    }
  }, 15000);
}

module.exports = {
  addReminder,
  startReminderLoop,
};

