import { toast } from 'sonner';

export enum methodENUM {
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  GET = "GET"
}

export const handleAPICall = async (
  endpoint: string,
  method: methodENUM,
  requestData?: any 
) => {
  try {
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (method !== methodENUM.GET && method !== methodENUM.DELETE && requestData) {
      options.body = JSON.stringify(requestData);
    }

    const response = await fetch(endpoint, options);

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      throw new Error(`Invalid JSON response from ${endpoint}`);
    }

    if (response.ok && result?.success) {
      toast.success(result?.msg || "Done");
      return result?.data;
    } else {
      toast.error(result?.msg || "Request failed");
      console.error(`API Error (${response.status}):`, result);
      return undefined;
    }
  } catch (error) {
    toast.error("Something Went Wrong (Check Console)");
    console.error(`ERROR at ${endpoint}:`, error);
    return undefined;
  }
};
