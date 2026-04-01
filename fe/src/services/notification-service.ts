import api from "@/lib/api";
import { Notification, UnreadCountResponse } from "@/lib/types";

export async function getNotifications(limit = 20) {
  const response = await api.get<{ success: boolean; data: Notification[] }>(
    `/notifications?limit=${limit}`
  );
  return response.data;
}

export async function getUnreadCount() {
  const response = await api.get<{
    success: boolean;
    data: UnreadCountResponse;
  }>("/notifications/unread-count");
  return response.data;
}

export async function markAsRead(id: string) {
  const response = await api.put<{ success: boolean }>(
    `/notifications/${id}/read`
  );
  return response.data;
}

export async function markAllAsRead() {
  const response = await api.put<{ success: boolean }>(
    "/notifications/read-all"
  );
  return response.data;
}
