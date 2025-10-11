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

  return <Button onClick={handleLeaveGroup} variant="destructive">Leave Group</Button>;
}