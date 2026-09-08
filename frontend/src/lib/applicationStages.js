export const APPLICATION_STAGES = [
  { key: "pending", label: "Awaiting review", description: "Your application is waiting for the recruiter to review it." },
  { key: "reviewed", label: "Reviewed", description: "The recruiter has marked your application as reviewed." },
  { key: "shortlisted", label: "Shortlisted", description: "The recruiter has added your application to the shortlist." },
  { key: "rejected", label: "Not selected", description: "The recruiter has not selected your application for this role." },
];
export function applicationStage(key) {
  return APPLICATION_STAGES.find(stage => stage.key === key) || { key, label: "Status unavailable", description: "No status information is available for this application." };
}
