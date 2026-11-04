"use client";

import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import axios from "axios";

interface LeaveGroupButtonProps {
  groupId: string;
  userId: string;
  token: string;
}

export function LeaveGroupButton({ groupId, userId, token }: LeaveGroupButtonProps) {
  const router = useRouter();

  const handleLeaveGroup = async () => {
    try {
      await axios.delete(`/api/groups/${groupId}/member`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { userId },
      });
      router.push("/");
    } catch (error) {
      console.error("Failed to leave group:", error);
    }
  };

  return <Button onClick={handleLeaveGroup} variant="outline" size="sm" className="rounded-lg border-destructive/20 px-2.5 text-xs text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive">Leave</Button>;
}