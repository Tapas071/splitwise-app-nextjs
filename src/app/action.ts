`use server`
import axios from 'axios';

export async function getUser() {
  const { getDb, serializeDoc } = await import('../../lib/mongodb');
  const db = await getDb();
  const users = await db.collection('users').find({}).toArray();
  return new Response(JSON.stringify(users.map((user) => serializeDoc(user))));
}

export async function getGroupWithId(groupId: string) {
  const { getDb, serializeDoc, toObjectId } = await import('../../lib/mongodb');
  const db = await getDb();
  const group = await db.collection('groups').findOne({ _id: toObjectId(groupId) });
  return new Response(JSON.stringify(serializeDoc(group)));
}

export async function makeGetRequest(url:string){
  const fullUrl = process.env.BASE_URL + url
  console.log('fullUrl', fullUrl)
  const res = await fetch(url);
  return res
}
interface Group {
  id: string;
  name: string;
  // You might need to add other fields like members, expenses, etc.
}
export const getGroupData = async (id: string, token: string): Promise<Group> => {
  const baseURL = "http://localhost:3000";

  try {
    const response = await axios.get<Group>(`${baseURL}/api/groups/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to fetch group ${id}:`, error);
    throw new Error('Could not retrieve group data.');
  }
};

interface SplitAmount {
  userId: string;
  amount: number;
}

interface CreateExpenseData {
  description: string;
  amount: number;
  paidById: string;
  groupId: string;
  splitAmong: SplitAmount[];
}

interface CreateExpenseResponse {
  id: string;
  description: string;
  amount: number;
  paidById: string;
  groupId: string;
  createdAt: string;
  updatedAt: string;
}


export const createExpense = async (
  expenseData: CreateExpenseData,
  token: string
): Promise<CreateExpenseResponse> => {
  const baseURL = process.env.BASE_URL || "http://localhost:3000";

  try {
    console.log('Sending expense data:', JSON.stringify(expenseData, null, 2)); // Add this line
    const response = await axios.post<CreateExpenseResponse>(
      `${baseURL}/api/expenses`,
      expenseData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Failed to create expense:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 'Could not create expense. Please try again.'
      );
    }
    console.error('Unexpected error creating expense:', error);
    throw new Error('An unexpected error occurred while creating the expense.');
  }
};


interface CreateGroupData {
  name: string;
}

interface CreateGroupResponse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export const createGroup = async (
  groupData: CreateGroupData,
  token: string
): Promise<CreateGroupResponse> => {
  const baseURL = process.env.BASE_URL || "http://localhost:3000";

  try {
    const response = await axios.post<CreateGroupResponse>(
      `${baseURL}/api/groups`,
      groupData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Failed to create group:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 'Could not create group. Please try again.'
      );
    }
    console.error('Unexpected error creating group:', error);
    throw new Error('An unexpected error occurred while creating the group.');
  }
};

interface AddMemberResponse {
  id: string;
  groupId: string;
  userId: string;
}

export const addMember = async (
  groupId: string,
  userId: string,
  token: string
): Promise<AddMemberResponse> => {
  const baseURL = process.env.BASE_URL || "http://localhost:3000";

  try {
    const response = await axios.post<AddMemberResponse>(
      `${baseURL}/api/groups/${groupId}/member`,
      { userId },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Failed to add member:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 'Could not add member. Please try again.'
      );
    }
    console.error('Unexpected error adding member:', error);
    throw new Error('An unexpected error occurred while adding the member.');
  }
};
