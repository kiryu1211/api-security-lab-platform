import { labResources, labUsers } from "@/data/lab-samples";

export type LabSampleFilters = {
  userId?: string;
  resourceType?: "order" | "profile" | "report";
};

export function listLabSamples(filters: LabSampleFilters = {}) {
  const resources = labResources.filter((resource) => {
    if (filters.userId && resource.ownerId !== filters.userId) {
      return false;
    }

    if (
      filters.resourceType &&
      resource.resourceType !== filters.resourceType
    ) {
      return false;
    }

    return true;
  });

  return {
    users: labUsers,
    resources,
  };
}
