// Vendor register API requests.
import { apiFetch } from "./http";
import type { Vendor, VendorPayload } from "../types/systemRegister";

type VendorsResponse = {
  vendors: Vendor[];
};

type VendorResponse = {
  vendor: Vendor;
};

// Retrieves all registered vendors.
export function getVendors() {
  return apiFetch<VendorsResponse>("/vendors");
}

// Creates a new vendor entry.
export function createVendor(payload: VendorPayload) {
  return apiFetch<VendorResponse>("/vendors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Updates vendor information.
export function updateVendor(id: number, payload: VendorPayload) {
  return apiFetch<VendorResponse>(`/vendors/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Deletes vendor entry.
export function deleteVendor(id: number) {
  return apiFetch<{ message: string }>(`/vendors/${id}`, {
    method: "DELETE",
  });
}
