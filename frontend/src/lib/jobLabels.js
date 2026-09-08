export function educationLabel(value) {
  return { any: "Any education level", olevel: "Secondary education", bachelor: "Bachelor’s degree", master: "Master’s degree", phd: "Doctorate" }[value] || value || "Education not specified";
}
export function experienceLabel(years) {
  return years == null ? "Experience not specified" : Number(years) === 0 ? "No experience required" : `${years}+ years experience`;
}
