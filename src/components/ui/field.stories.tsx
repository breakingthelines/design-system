import preview from '#.storybook/preview';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from './field';
import { Input } from './input';
import { Textarea } from './textarea';

const meta = preview.meta({
  title: 'UI/Field',
  component: Field,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal', 'responsive'],
    },
  },
});

export const Default = meta.story({
  render: () => (
    <Field>
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <Input id="email" type="email" placeholder="Enter your email" />
    </Field>
  ),
});

export const WithDescription = meta.story({
  render: () => (
    <Field>
      <FieldLabel htmlFor="username">Username</FieldLabel>
      <Input id="username" placeholder="Choose a username" />
      <FieldDescription>This will be your public display name.</FieldDescription>
    </Field>
  ),
});

export const WithError = meta.story({
  render: () => (
    <Field data-invalid="true">
      <FieldLabel htmlFor="password">Password</FieldLabel>
      <Input id="password" type="password" aria-invalid placeholder="Enter password" />
      <FieldError>Password must be at least 8 characters.</FieldError>
    </Field>
  ),
});

export const AllOrientations = meta.story({
  render: () => (
    <div className="flex flex-col gap-8 w-96">
      <Field orientation="vertical">
        <FieldLabel htmlFor="vertical">Vertical (Default)</FieldLabel>
        <Input id="vertical" placeholder="Vertical layout" />
      </Field>
      <Field orientation="horizontal">
        <FieldLabel htmlFor="horizontal">Horizontal</FieldLabel>
        <Input id="horizontal" placeholder="Horizontal layout" />
      </Field>
      <FieldGroup>
        <Field orientation="responsive">
          <FieldLabel htmlFor="responsive">Responsive</FieldLabel>
          <Input id="responsive" placeholder="Adapts to container" />
        </Field>
      </FieldGroup>
    </div>
  ),
});

export const FieldGroupExample = meta.story({
  render: () => (
    <FieldGroup className="w-96">
      <Field>
        <FieldLabel htmlFor="first-name">First Name</FieldLabel>
        <Input id="first-name" placeholder="John" />
      </Field>
      <Field>
        <FieldLabel htmlFor="last-name">Last Name</FieldLabel>
        <Input id="last-name" placeholder="Doe" />
      </Field>
      <Field>
        <FieldLabel htmlFor="bio">Bio</FieldLabel>
        <Textarea id="bio" placeholder="Tell us about yourself" />
      </Field>
    </FieldGroup>
  ),
});

export const FieldSetExample = meta.story({
  render: () => (
    <FieldSet className="w-96">
      <FieldLegend>Contact Information</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="contact-email">Email</FieldLabel>
          <Input id="contact-email" type="email" placeholder="email@example.com" />
        </Field>
        <Field>
          <FieldLabel htmlFor="phone">Phone</FieldLabel>
          <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
});

export const WithSeparator = meta.story({
  render: () => (
    <FieldGroup className="w-96">
      <Field>
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <Input id="name" placeholder="Your name" />
      </Field>
      <FieldSeparator>or</FieldSeparator>
      <Field>
        <FieldLabel htmlFor="nickname">Nickname</FieldLabel>
        <Input id="nickname" placeholder="Your nickname" />
      </Field>
    </FieldGroup>
  ),
});

export const WithFieldContent = meta.story({
  render: () => (
    <Field orientation="horizontal" className="w-96">
      <input type="checkbox" id="terms" className="size-4" />
      <FieldContent>
        <FieldTitle>Accept Terms</FieldTitle>
        <FieldDescription>
          I agree to the <a href="#">terms of service</a> and <a href="#">privacy policy</a>.
        </FieldDescription>
      </FieldContent>
    </Field>
  ),
});
