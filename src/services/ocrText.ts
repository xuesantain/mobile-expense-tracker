export type ImageToTextResult = {
  text: string;
  engine: "placeholder" | "native" | "remote";
};

export type ImageToTextProvider = (imageUri: string) => Promise<ImageToTextResult>;

let provider: ImageToTextProvider | null = null;

export function configureImageToText(nextProvider: ImageToTextProvider | null): void {
  provider = nextProvider;
}

export async function imageToText(imageUri: string): Promise<ImageToTextResult> {
  if (provider) {
    return provider(imageUri);
  }

  return {
    text: "",
    engine: "placeholder"
  };
}
