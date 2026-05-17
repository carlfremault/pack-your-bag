import { BsBackpack } from 'react-icons/bs';
import { IoShirtOutline } from 'react-icons/io5';
import { MdHiking, MdOutlineFormatListBulleted } from 'react-icons/md';

export function WelcomeCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-1 items-center justify-center md:min-w-md">
      <div className="bg-surface border-primary-ring flex w-full max-w-md flex-col gap-6 rounded-md border p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="text-primary flex flex-col">
            <h1 className="mb-0 text-xl">PackYourBag!</h1>
            <p className="text-xs font-medium">Your modular packing list companion</p>
          </div>
          <div className="bg-success text-success-foreground block w-fit rounded-xl border px-1.5 py-0.5 align-bottom text-[10px] font-medium uppercase">
            Free
          </div>
        </div>

        <div className="grid grid-cols-[32px_1fr] items-center gap-x-4 gap-y-0">
          <div className="text-ocean-text bg-ocean-bg border-ocean-border my-1 flex justify-center rounded-md border p-1">
            <IoShirtOutline className="h-5 w-5" />
          </div>
          <div className="text-primary text-xs">
            <p className="font-medium">Items</p>
            <p className="font-light">The things you pack, by category</p>
          </div>

          <div className="border-primary/50 mx-auto h-4 w-0 border-l border-dotted"></div>
          <div />

          <div className="text-sand-text bg-sand-bg border-sand-border my-1 flex justify-center rounded-md border p-1">
            <MdOutlineFormatListBulleted className="h-5 w-5" />
          </div>
          <div className="text-primary text-xs">
            <p className="font-medium">Lists</p>
            <p className="font-light">Reusable groups of items</p>
          </div>

          <div className="border-primary/50 mx-auto h-4 w-0 border-l border-dotted"></div>
          <div />

          <div className="text-coral-text bg-coral-bg border-coral-border my-1 flex justify-center rounded-md border p-1">
            <BsBackpack className="h-5 w-5" />
          </div>
          <div className="text-primary text-xs">
            <p className="font-medium">Packs</p>
            <p className="font-light">Your bag. Holds items and lists</p>
          </div>

          <div className="border-primary/50 mx-auto h-4 w-0 border-l border-dotted"></div>
          <div />

          <div className="text-jungle-text bg-jungle-bg border-jungle-border my-1 flex justify-center rounded-md border p-1">
            <MdHiking className="h-5 w-5" />
          </div>
          <div className="text-primary text-xs">
            <p className="font-medium">Trips</p>
            <p className="font-light">The destination. Has an assigned pack</p>
          </div>
        </div>
        <div className="flex flex-col">
          <p className="text-primary text-sm">Check off items as you pack.</p>
          <p className="text-primary text-sm">Forget nothing. Enjoy your trip.</p>
        </div>

        {children}
      </div>
    </div>
  );
}
