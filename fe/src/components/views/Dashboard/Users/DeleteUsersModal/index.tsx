import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import Typography from '@/components/ui/typography';
import useDeleteUsersModal from './useDeleteUsersModal';

interface PropsTypes {
  id: string;
}

const DeleteUsersModal = (props: PropsTypes) => {
  const { id } = props;
  const { mutateDeleteUser } = useDeleteUsersModal();

  return (
    <div className="">
      <div className="flex justify-center flex-col items-center gap-6">
        <Typography variant="h3">Anda yakin ingin menghapus data?</Typography>
        <Typography variant="bodyRegular" className="text-secondary-text">
          Setelah dihapus, data tidak bisa dipulihkan kembali.
        </Typography>
        <div className="space-x-5">
          <DialogClose asChild>
            <Button variant={'primary-outline'}>Batal</Button>
          </DialogClose>
          <Button
            variant={'primary'}
            onClick={() => {
              mutateDeleteUser(id);
            }}>
            Hapus
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUsersModal;
