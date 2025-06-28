import React from "react";
import { Popover, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { PopoverContent } from "@radix-ui/react-popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

export type ComboBoxProps = {
  data: { value: string; label: string }[];
  comboBoxValue: string[];
  setComboBoxValue: (values: string[]) => void;
};

const ComboBox = ({ data, comboBoxValue, setComboBoxValue }: ComboBoxProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            {comboBoxValue.length > 0
              ? data
                  .filter((item) => comboBoxValue.includes(item.value))
                  .map((item) => item.label)
                  .join(", ")
              : "Select Permissions..."}
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-full">
          <Command className="w-full border">
            <CommandInput className="w-full" placeholder="Search Permissions..." />
            <CommandList>
              <CommandEmpty>No data found.</CommandEmpty>
              <CommandGroup>
                {data.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={(currentValue) => {
                      const isSelected = comboBoxValue.includes(currentValue);
                      if (isSelected) {
                        setComboBoxValue(
                          comboBoxValue.filter((v) => v !== currentValue)
                        );
                      } else {
                        setComboBoxValue([...comboBoxValue, currentValue]);
                      }
                    }}
                  >
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ComboBox;
