export const getLatestUploadedEpoch = async () => {
  const res = await fetch(
    "http://150.109.123.18:1317/enreach/workload/workload?pagination.reverse=true",
  ).then((r) => r.json());

  return Number(res?.Workload?.[0]?.epoch || "0");
};
