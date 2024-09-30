import React, { useState } from 'react';
import { useUser } from './shared/UserContext';
import { useAccount } from 'wagmi';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SignUpForm = () => {
  const { user, updateUser } = useUser();
  const { address } = useAccount();
  const [username, setUsername] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (user && address && username.trim() !== "") {
      await updateUser({ address, username });
      console.log("Utilisateur mis à jour avec adresse et pseudo");
    }
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div>
        <label htmlFor="username" className="text-gray-800 dark:text-gray-200">Pseudo</label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
        />
      </div>
      <Button type="submit" className="w-full bg-lime-500 hover:bg-lime-600 text-white font-bold" disabled={username.trim() === ""}>
        Enregistrer le pseudo
      </Button>
    </form>
  );
};

export default SignUpForm;
