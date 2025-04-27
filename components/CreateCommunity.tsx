// Componente para criação de novas comunidades
// Permite definir nome, descrição e upload de avatar
// Integra com Cloudinary para armazenamento de imagens
// Cria a comunidade no Supabase e adiciona o criador como admin
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';

export default function CreateCommunity() {
  // Estados para gerenciar o formulário
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createBrowserClient();

  // Manipula a mudança do arquivo de avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
    }
  };

  // Processa o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      let avatarUrl = null;

      // Upload do avatar para o Cloudinary se fornecido
      if (avatar) {
        const formData = new FormData();
        formData.append('file', avatar);
        formData.append('upload_preset', 'community_avatars');

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await response.json();
        avatarUrl = data.secure_url;
      }

      // Cria a comunidade no banco de dados
      const { data: community, error } = await supabase
        .from('communities')
        .insert({
          name,
          description,
          avatar_url: avatarUrl,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Adiciona o criador como primeiro membro e admin
      await supabase.from('community_members').insert({
        community_id: community.id,
        user_id: user.id,
        role: 'admin',
      });

      // Redireciona para a página da comunidade
      router.push(`/community/${community.id}`);
    } catch (error) {
      console.error('Error creating community:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create Community</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2">Community Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full p-2 border rounded"
            rows={4}
          />
        </div>

        <div>
          <label className="block mb-2">Community Avatar</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Creating...' : 'Create Community'}
        </button>
      </form>
    </div>
  );
}