export const EMAIL_TEMPLATES = {
  claimReported: (clientName: string, claimNumber: string) => ({
    subject: `Royal Square: Claim ${claimNumber} Reported`,
    text: `Dear ${clientName}, your motor loss claim ${claimNumber} has been received. Our advisory triage team has initiated communications with your insurer.`,
  }),
  requestLogged: (clientName: string, requestNumber: string, title: string) => ({
    subject: `Royal Square: Service Request ${requestNumber} Logged`,
    text: `Dear ${clientName}, your request "${title}" has been registered under reference ${requestNumber}.`,
  }),
};
