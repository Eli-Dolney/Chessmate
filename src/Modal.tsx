import {useLayoutEffect,useRef,type ReactNode} from 'react';

/** Native modal behavior keeps keyboard focus inside and restores it on close. */
export default function Modal({label,className='modal',onClose,children}:{label:string;className?:string;onClose:()=>void;children:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);
 useLayoutEffect(()=>{const dialog=ref.current!;dialog.showModal();return()=>dialog.close();},[]);
 return <dialog ref={ref} className={`${className} modal-dialog`} aria-label={label} onCancel={event=>{event.preventDefault();onClose();}} onKeyDown={event=>{
  if(event.key!=='Tab')return;
  const controls=[...ref.current!.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>el.getClientRects().length>0);
  const first=controls[0],last=controls.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 }}>{children}</dialog>;
}
