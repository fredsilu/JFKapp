import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export async function uploadProfilePicture(file: File, clientId: string): Promise<string> {
  // Create a reference to the profile picture
  const storageRef = ref(storage, `clients/${clientId}/profile.jpg`);

  // Upload the file
  await uploadBytes(storageRef, file);

  // Get the download URL
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

export async function deleteProfilePicture(clientId: string): Promise<void> {
  const storageRef = ref(storage, `clients/${clientId}/profile.jpg`);
  await deleteObject(storageRef);
}