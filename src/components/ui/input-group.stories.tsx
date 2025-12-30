import preview from '#.storybook/preview';
import { MagnifyingGlass, Eye, EyeSlash, At, CurrencyDollar } from '@phosphor-icons/react';
import { useState } from 'react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from './input-group';

const meta = preview.meta({
  title: 'UI/InputGroup',
  component: InputGroup,
  tags: ['autodocs'],
});

export const Default = meta.story({
  render: () => (
    <InputGroup className="w-64">
      <InputGroupAddon align="inline-start">
        <MagnifyingGlass />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search..." />
    </InputGroup>
  ),
});

export const WithButton = meta.story({
  render: function Render() {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <InputGroup className="w-64">
        <InputGroupInput type={showPassword ? 'text' : 'password'} placeholder="Password" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeSlash /> : <Eye />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    );
  },
});

export const WithText = meta.story({
  render: () => (
    <InputGroup className="w-64">
      <InputGroupAddon align="inline-start">
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="example.com" />
    </InputGroup>
  ),
});

export const AllAlignments = meta.story({
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <At />
        </InputGroupAddon>
        <InputGroupInput placeholder="inline-start" />
      </InputGroup>
      <InputGroup>
        <InputGroupInput placeholder="inline-end" />
        <InputGroupAddon align="inline-end">
          <CurrencyDollar />
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupAddon align="block-start" className="border-b">
          Block Start Label
        </InputGroupAddon>
        <InputGroupInput placeholder="block-start" />
      </InputGroup>
      <InputGroup>
        <InputGroupInput placeholder="block-end" />
        <InputGroupAddon align="block-end" className="border-t">
          Block End Label
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
});

export const WithTextarea = meta.story({
  render: () => (
    <InputGroup className="w-80">
      <InputGroupAddon align="block-start" className="border-b">
        Message
      </InputGroupAddon>
      <InputGroupTextarea placeholder="Type your message..." />
    </InputGroup>
  ),
});

export const CombinedAddons = meta.story({
  render: () => (
    <InputGroup className="w-72">
      <InputGroupAddon align="inline-start">
        <CurrencyDollar />
      </InputGroupAddon>
      <InputGroupInput type="number" placeholder="0.00" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>USD</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
});

export const Disabled = meta.story({
  render: () => (
    <InputGroup className="w-64">
      <InputGroupAddon align="inline-start">
        <MagnifyingGlass />
      </InputGroupAddon>
      <InputGroupInput placeholder="Disabled input" disabled />
    </InputGroup>
  ),
});
