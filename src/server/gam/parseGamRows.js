export function parseGamRows(rows) {
  const result = [];

  for (const row of rows) {
    const keyValue = row.dimensionValues?.[0]?.stringValue;

    if (!keyValue || !keyValue.startsWith("utm_campaign=")) continue;

    const values = row.metricValueGroups?.[0]?.primaryValues || [];

    result.push({
      key: "utm_campaign",
      value: keyValue.replace("utm_campaign=", ""),
      impressions: Number(values[0]?.intValue || 0),
      ecpm: Number(values[1]?.doubleValue || 0),
      revenue: Number(values[2]?.doubleValue || 0),
    });
  }

  return result;
}